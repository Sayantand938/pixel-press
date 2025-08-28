// src/components/pages/BookReader.tsx
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const MotionButton = motion(Button);

interface Chapter {
  number: number;
  title: string;
  file: string;
}

interface BookMetadata {
  title: string;
  author: string;
  chapters: Chapter[];
}

const fetchMetadata = async (bookId: string): Promise<BookMetadata> => {
  const response = await fetch(`/Books/${bookId}/metadata.json`);
  if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status})`);
  return response.json();
};

const fetchChapterContent = async (bookId: string, filePath: string): Promise<string> => {
  const response = await fetch(`/Books/${bookId}/${filePath}`);
  if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status})`);
  return response.text();
};

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
} as const;

export function BookReader() {
  const { bookId, chapterNumber } = useParams({ from: '/books/$bookId/chapter/$chapterNumber' });
  const currentChapterNum = parseInt(chapterNumber, 10);

  const { data: metadata, isLoading: isMetadataLoading, error: metadataError } = useQuery({
    queryKey: ['bookMetadata', bookId],
    queryFn: () => fetchMetadata(bookId),
    enabled: !!bookId,
  });

  const chapter = metadata?.chapters.find(ch => ch.number === currentChapterNum);
  const currentIndex = metadata?.chapters.findIndex(ch => ch.number === currentChapterNum);

  const { data: chapterContent, isLoading: isChapterLoading, error: chapterError } = useQuery({
    queryKey: ['chapterContent', bookId, chapter?.file],
    queryFn: () => fetchChapterContent(bookId, chapter!.file),
    enabled: !!bookId && !!chapter,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentChapterNum]);
  
  if (isMetadataLoading) {
    return <div className="text-center p-8">Loading Book...</div>;
  }

  if (metadataError) {
    return <div className="text-center p-8 text-destructive">Error loading book data: {metadataError.message}</div>;
  }
  
  if (!metadata || !chapter || typeof currentIndex !== 'number' || currentIndex < 0) {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold">Chapter Not Found</h2>
        <p className="mt-2 text-muted-foreground">Chapter {currentChapterNum} does not exist.</p>
        <Button asChild variant="link" className="mt-4 text-base">
          <Link to="/books/$bookId" params={{ bookId }}>&larr; Back to Table of Contents</Link>
        </Button>
      </div>
    );
  }

  const prevChapter = currentIndex > 0 ? metadata.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < metadata.chapters.length - 1 ? metadata.chapters[currentIndex + 1] : null;

  return (
    <motion.div 
      className="container mx-auto max-w-3xl p-4 md:p-8"
      key={currentChapterNum}
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="flex justify-between items-center mb-4">
        {/* MODIFIED: Made font size responsive */}
        <Button asChild variant="link" className="p-0 text-sm md:text-base">
          <Link to="/books/$bookId" params={{ bookId }}>&larr; Back to Chapters</Link>
        </Button>
        {/* MODIFIED: Made font size responsive */}
        <Button asChild variant="link" className="p-0 text-sm md:text-base">
          <Link to="/">&larr; Back to Library</Link>
        </Button>
      </div>

      <header className="mb-8 border-b pb-4 text-center">
        <h1 className="text-2xl text-muted-foreground">{metadata.title}</h1>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{chapter.title}</h2>
      </header>

      <article className="text-lg md:text-xl leading-relaxed [&_p]:mb-6">
        {isChapterLoading && <p>Loading content...</p>}
        {chapterError && <p className="text-destructive">Error loading chapter content: {chapterError.message}</p>}
        {chapterContent && <ReactMarkdown>{chapterContent}</ReactMarkdown>}
      </article>

      <footer className="mt-8 pt-4 border-t flex justify-between items-center">
        <MotionButton asChild disabled={!prevChapter} size="sm" className="md:size-auto">
          <Link
            to="/books/$bookId/chapter/$chapterNumber"
            params={{ bookId, chapterNumber: String(prevChapter?.number || '') }}
            disabled={!prevChapter}
          >
            Previous
          </Link>
        </MotionButton>
        <span className="text-sm text-muted-foreground md:text-base">
          Chapter {currentChapterNum} of {metadata.chapters.length}
        </span>
        <MotionButton asChild disabled={!nextChapter} size="sm" className="md:size-auto">
          <Link
            to="/books/$bookId/chapter/$chapterNumber"
            params={{ bookId, chapterNumber: String(nextChapter?.number || '') }}
            disabled={!nextChapter}
          >
            Next
          </Link>
        </MotionButton>
      </footer>
    </motion.div>
  );
}