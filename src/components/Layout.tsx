import { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import PageTransition from './PageTransition';
import ScrollProgress from './ScrollProgress';
import ShortcutHint from './ShortcutHint';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground relative noise">
        <ScrollProgress />
        <Navigation />
        <main className="relative z-10">{children}</main>
        <Footer />
        <ShortcutHint />
      </div>
    </PageTransition>
  );
};

export default Layout;
