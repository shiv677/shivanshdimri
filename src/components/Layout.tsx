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
    <div className="min-h-screen bg-[#08090a] text-[#ededed] relative overflow-x-hidden selection:bg-white/20 selection:text-white">
      <ScrollProgress />
      <Navigation />
      <PageTransition>
        <main className="relative z-10">{children}</main>
      </PageTransition>
      <Footer />
      <ShortcutHint />
    </div>
  );
};

export default Layout;
