import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // 1. Import Skeleton
import { useThemeStore } from '@/store/themeStore';
import { useState } from 'react';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// 2. NEW BookCard component to manage its own image loading state
function BookCard({ book }: { book: Book }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <MotionCard
      className="overflow-hidden rounded-lg shadow-md p-0 border-0 relative"
      variants={cardVariants}
    >
      <Link to="/books/$bookId" params={{ bookId: book.id }} className="relative block w-full h-full">
        {/* Skeleton placeholder, shown until the image is loaded */}
        {!isLoaded && <Skeleton className="w-full h-full aspect-[2/3] absolute" />}

        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          loading="lazy" // Native browser lazy loading
          onLoad={() => setIsLoaded(true)} // Fade in image on load
          className={`w-full h-full object-cover aspect-[2/3] transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h3 className="text-lg font-bold text-white truncate">{book.title}</h3>
          <p className="text-sm text-white/80">{book.author}</p>
        </div>
      </Link>
    </MotionCard>
  );
}

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
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Pixel Press</h1>
        <p className="text-muted-foreground mt-2 text-base md:text-lg">Your premium destination for digital reading.</p>
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

      {error && <p className="text-center text-destructive">Error fetching library: {error.message}</p>}

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 3. MODIFIED: Show skeleton grid while loading */}
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[2/3] rounded-lg" />
          ))
        ) : (
          filteredBooks?.map((book) => <BookCard key={book.id} book={book} />)
        )}
      </motion.div>
    </div>
  );
}