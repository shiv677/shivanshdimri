import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Home, 
  Briefcase, 
  User, 
  Calendar, 
  Mail, 
  FileText, 
  ExternalLink,
  Github,
  Linkedin,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface CommandItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  group: string;
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setOpen(false);
  }, [resolvedTheme, setTheme]);

  const commands: CommandItem[] = [
    // Navigation
    { icon: <Home size={16} />, label: 'Home', shortcut: 'G H', action: () => handleNavigate('/'), group: 'Navigation' },
    { icon: <Briefcase size={16} />, label: 'Work', shortcut: 'G W', action: () => handleNavigate('/work'), group: 'Navigation' },
    { icon: <User size={16} />, label: 'About', shortcut: 'G A', action: () => handleNavigate('/about'), group: 'Navigation' },
    { icon: <Calendar size={16} />, label: 'Experience', shortcut: 'G E', action: () => handleNavigate('/experience'), group: 'Navigation' },
    { icon: <Mail size={16} />, label: 'Contact', shortcut: 'G C', action: () => handleNavigate('/contact'), group: 'Navigation' },
    
    // Actions
    { icon: resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, label: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`, shortcut: '⌘D', action: toggleTheme, group: 'Actions' },
    { icon: <FileText size={16} />, label: 'Download Resume', action: () => { window.open('/SHIVANSH_DIMRI_CV.pdf', '_blank'); setOpen(false); }, group: 'Actions' },
    
    // Links
    { icon: <Github size={16} />, label: 'GitHub Profile', action: () => { window.open('https://github.com/shivanshdimri', '_blank'); setOpen(false); }, group: 'Links' },
    { icon: <Linkedin size={16} />, label: 'LinkedIn Profile', action: () => { window.open('https://linkedin.com/in/shivanshdimri', '_blank'); setOpen(false); }, group: 'Links' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groupedCommands = commands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = [];
    }
    acc[command.group].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedCommands).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={item.action}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {item.shortcut}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};

export default CommandPalette;
