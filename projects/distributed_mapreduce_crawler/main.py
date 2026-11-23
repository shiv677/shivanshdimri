import argparse
import asyncio
from pathlib import Path

try:
    from .crawler import DistributedMapReduceCrawler
except ImportError:
    from crawler import DistributedMapReduceCrawler


async def run_crawler_pipeline(seed_urls: list, max_tasks: int = 10):
    print("=" * 80)
    print("Distributed Async MapReduce Web & Corpus Crawler")
    print("=" * 80)
    print(f"Seed URLs: {len(seed_urls)}")

    crawler = DistributedMapReduceCrawler(max_depth=2)
    crawler.seed(seed_urls)

    stats = await crawler.run(max_tasks=max_tasks)

    print("-" * 80)
    print(f"Total Discovered URLs: {stats.total_discovered}")
    print(f"Total Completed:       {stats.total_completed}")
    print(f"Total Failed:          {stats.total_failed}")
    print(f"Total Words Extracted: {stats.total_words_extracted}")
    print("Domain Distribution:")
    for dom, cnt in stats.domain_counts.items():
        print(f"  - {dom:<30}: {cnt} pages")
    print("=" * 80)

    return stats


def main():
    parser = argparse.ArgumentParser(description="Distributed web and corpus crawler.")
    parser.add_argument("--seeds", nargs="+", default=["https://docs.python.org", "https://arxiv.org"], help="Seed URLs")
    parser.add_argument("--max-tasks", type=int, default=10, help="Maximum tasks to process")
    args = parser.parse_args()

    asyncio.run(run_crawler_pipeline(args.seeds, max_tasks=args.max_tasks))


if __name__ == "__main__":
    main()
