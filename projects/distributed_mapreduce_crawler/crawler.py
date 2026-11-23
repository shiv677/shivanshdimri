import asyncio
import hashlib
import re
import sqlite3
import time
from pathlib import Path
from typing import Callable, Coroutine, Dict, List, Optional
from urllib.parse import urlparse

try:
    from .models import CrawlStats, CrawlTask, ExtractedDocument, TaskStatus
except ImportError:
    from models import CrawlStats, CrawlTask, ExtractedDocument, TaskStatus


def extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower() or "default"


def clean_html_content(raw_html: str) -> str:
    no_script = re.sub(r"<(script|style).*?>.*?</\1>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
    no_tags = re.sub(r"<[^>]+>", " ", no_script)
    clean_text = re.sub(r"\s+", " ", no_tags).strip()
    return clean_text


def extract_links(raw_html: str, base_url: str) -> List[str]:
    hrefs = re.findall(r'href=[\'"]([^\'"]+)[\'"]', raw_html, flags=re.IGNORECASE)
    valid_links = []
    base_domain = extract_domain(base_url)
    for h in hrefs:
        if h.startswith("http://") or h.startswith("https://"):
            valid_links.append(h)
        elif h.startswith("/") and base_domain:
            valid_links.append(f"https://{base_domain}{h}")
    return sorted(list(set(valid_links)))


class SQLiteTaskQueue:
    def __init__(self, db_path: Path | str = ":memory:"):
        self.db_path = str(db_path)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        with self.conn:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    url TEXT PRIMARY KEY,
                    depth INTEGER,
                    domain TEXT,
                    status TEXT,
                    retry_count INTEGER,
                    max_retries INTEGER,
                    error_message TEXT,
                    created_at REAL,
                    updated_at REAL
                )
            """)
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    url TEXT PRIMARY KEY,
                    domain TEXT,
                    title TEXT,
                    content_text TEXT,
                    content_hash TEXT,
                    word_count INTEGER,
                    discovered_links TEXT,
                    latency_ms REAL
                )
            """)

    def push_task(self, task: CrawlTask) -> bool:
        try:
            with self.conn:
                self.conn.execute(
                    """
                    INSERT INTO tasks (url, depth, domain, status, retry_count, max_retries, error_message, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        task.url,
                        task.depth,
                        task.domain,
                        task.status.value,
                        task.retry_count,
                        task.max_retries,
                        task.error_message,
                        task.created_at,
                        task.updated_at,
                    ),
                )
            return True
        except sqlite3.IntegrityError:
            return False

    def claim_next_task(self) -> Optional[CrawlTask]:
        with self.conn:
            row = self.conn.execute(
                "SELECT * FROM tasks WHERE status = ? ORDER BY depth ASC, created_at ASC LIMIT 1",
                (TaskStatus.PENDING.value,),
            ).fetchone()
            if not row:
                return None

            url = row["url"]
            now = time.time()
            self.conn.execute(
                "UPDATE tasks SET status = ?, updated_at = ? WHERE url = ?",
                (TaskStatus.IN_PROGRESS.value, now, url),
            )
            data = dict(row)
            data["status"] = TaskStatus.IN_PROGRESS
            data["updated_at"] = now
            return CrawlTask(**data)

    def mark_completed(self, url: str, doc: ExtractedDocument):
        now = time.time()
        import json
        with self.conn:
            self.conn.execute(
                "UPDATE tasks SET status = ?, updated_at = ? WHERE url = ?",
                (TaskStatus.COMPLETED.value, now, url),
            )
            self.conn.execute(
                """
                INSERT OR REPLACE INTO documents (url, domain, title, content_text, content_hash, word_count, discovered_links, latency_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    doc.url,
                    doc.domain,
                    doc.title,
                    doc.content_text,
                    doc.content_hash,
                    doc.word_count,
                    json.dumps(doc.discovered_links),
                    doc.extraction_latency_ms,
                ),
            )

    def mark_failed(self, url: str, error: str):
        with self.conn:
            row = self.conn.execute("SELECT retry_count, max_retries FROM tasks WHERE url = ?", (url,)).fetchone()
            if row and row["retry_count"] < row["max_retries"]:
                self.conn.execute(
                    "UPDATE tasks SET status = ?, retry_count = retry_count + 1, error_message = ?, updated_at = ? WHERE url = ?",
                    (TaskStatus.PENDING.value, error, time.time(), url),
                )
            else:
                self.conn.execute(
                    "UPDATE tasks SET status = ?, error_message = ?, updated_at = ? WHERE url = ?",
                    (TaskStatus.FAILED.value, error, time.time(), url),
                )

    def get_stats(self) -> CrawlStats:
        with self.conn:
            rows = self.conn.execute("SELECT status, count(*) as cnt FROM tasks GROUP BY status").fetchall()
            status_map = {r["status"]: r["cnt"] for r in rows}

            doc_rows = self.conn.execute("SELECT SUM(word_count) as total_words, domain, count(*) as d_cnt FROM documents GROUP BY domain").fetchall()
            total_words = sum((r["total_words"] or 0) for r in doc_rows)
            domain_counts = {r["domain"]: r["d_cnt"] for r in doc_rows}

            total_discovered = sum(status_map.values())
            return CrawlStats(
                total_discovered=total_discovered,
                total_completed=status_map.get(TaskStatus.COMPLETED.value, 0),
                total_failed=status_map.get(TaskStatus.FAILED.value, 0),
                total_words_extracted=total_words,
                domain_counts=domain_counts,
            )


class DistributedMapReduceCrawler:
    def __init__(
        self,
        db_path: Path | str = ":memory:",
        max_concurrency: int = 4,
        max_depth: int = 2,
        fetcher: Optional[Callable[[str], Coroutine[None, None, str]]] = None,
    ):
        self.queue = SQLiteTaskQueue(db_path)
        self.max_concurrency = max_concurrency
        self.max_depth = max_depth
        self.fetcher = fetcher or self._default_mock_fetcher
        self.domain_semaphores: Dict[str, asyncio.Semaphore] = {}

    async def _default_mock_fetcher(self, url: str) -> str:
        domain = extract_domain(url)
        return f"""
        <html>
            <head><title>Page {url}</title></head>
            <body>
                <h1>Knowledge Discovery node {domain}</h1>
                <p>High performance distributed systems require streaming architectures and state checkpoints.</p>
                <a href="https://{domain}/subpage1">Subpage</a>
            </body>
        </html>
        """

    def _get_domain_semaphore(self, domain: str) -> asyncio.Semaphore:
        if domain not in self.domain_semaphores:
            self.domain_semaphores[domain] = asyncio.Semaphore(2)
        return self.domain_semaphores[domain]

    def seed(self, urls: List[str]):
        for u in urls:
            task = CrawlTask(url=u, depth=0, domain=extract_domain(u))
            self.queue.push_task(task)

    async def crawl_task(self, task: CrawlTask) -> Optional[ExtractedDocument]:
        sem = self._get_domain_semaphore(task.domain)
        async with sem:
            start_t = time.perf_counter()
            try:
                html = await self.fetcher(task.url)
                latency_ms = (time.perf_counter() - start_t) * 1000.0

                text = clean_html_content(html)
                content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
                links = extract_links(html, task.url)
                title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
                title = title_match.group(1).strip() if title_match else task.url

                doc = ExtractedDocument(
                    url=task.url,
                    domain=task.domain,
                    title=title,
                    content_text=text,
                    content_hash=content_hash,
                    word_count=len(text.split()),
                    discovered_links=links,
                    extraction_latency_ms=round(latency_ms, 2),
                )

                self.queue.mark_completed(task.url, doc)

                # Add child links if within max depth
                if task.depth < self.max_depth:
                    for l in links:
                        child_task = CrawlTask(url=l, depth=task.depth + 1, domain=extract_domain(l))
                        self.queue.push_task(child_task)

                return doc
            except Exception as e:
                self.queue.mark_failed(task.url, str(e))
                return None

    async def run(self, max_tasks: int = 20) -> CrawlStats:
        processed = 0
        while processed < max_tasks:
            task = self.queue.claim_next_task()
            if not task:
                break
            await self.crawl_task(task)
            processed += 1
        return self.queue.get_stats()
