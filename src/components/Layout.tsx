import { ReactNode } from 'react';
import ActiveTheoryLayout from './activetheory/ActiveTheoryLayout';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return <ActiveTheoryLayout>{children}</ActiveTheoryLayout>;
};

export default Layout;
