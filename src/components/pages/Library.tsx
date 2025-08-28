import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/themeStore';

// Convert the static Card component into an animatable one
const MotionCard = motion(Card);

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

interface SearchForm {
  searchQuery: string;
}

const fetchBooks = async (): Promise<Book[]> => {
  const response = await fetch('/books.json');
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

// Animation variants for the container to orchestrate the staggered animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Animation variants for each book card - simplified to a simple fade-in
const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function Library() {
  const { register, watch } = useForm<SearchForm>({ defaultValues: { searchQuery: '' } });
  const searchQuery = watch('searchQuery');
  const { data: books, isLoading, error } = useQuery({ queryKey: ['books'], queryFn: fetchBooks });
  const { toggleTheme } = useThemeStore();

  const filteredBooks = books?.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8 relative">
        <h1 className="text-5xl font-bold tracking-tight">Pixel Press</h1>
        <p className="text-muted-foreground mt-2 text-lg">Your premium destination for digital reading.</p>
        <div className="absolute top-0 right-0">
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto mb-10">
        <Input
          type="search"
          placeholder="Search by title or author..."
          className="text-base h-11"
          {...register('searchQuery')}
        />
      </div>

      {isLoading && <p className="text-center">Loading library...</p>}
      {error && <p className="text-center text-destructive">Error fetching library: {error.message}</p>}

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredBooks?.map((book) => (
          // FIXED: Removed card padding (p-0) and border (border-0) to allow the image to fill the container.
          <MotionCard 
            key={book.id} 
            className="overflow-hidden rounded-lg shadow-md p-0 border-0"
            variants={cardVariants}
          >
            <Link to="/books/$bookId" params={{ bookId: book.id }} className="relative block w-full h-full">
              <img
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                className="w-full h-full object-cover aspect-[2/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-lg font-bold text-white truncate">{book.title}</h3>
                <p className="text-sm text-white/80">{book.author}</p>
              </div>
            </Link>
          </MotionCard>
        ))}
      </motion.div>
    </div>
  );
}