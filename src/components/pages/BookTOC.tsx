import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // 1. Import Skeleton
import { useState } from 'react';

const MotionButton = motion(Button);

interface Chapter {
 number: number;
 title: string;
}

interface BookMetadata {
 title: string;
 author: string;
 coverUrl: string;
 chapters: Chapter[];
}

const fetchMetadata = async (bookId: string): Promise<BookMetadata> => {
 const response = await fetch(`/Books/${bookId}/metadata.json`);
 if (!response.ok) throw new Error('Failed to fetch metadata');
 const data = await response.json();
 return { ...data, coverUrl: `/Books/${bookId}/cover.jpg` };
};

const pageVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { duration: 0.2 } },
};

// 2. NEW Image component with its own loader
function ImageWithLoader({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className="relative">
      {!isLoaded && <Skeleton className="absolute w-full h-full rounded-lg" />}
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`rounded-lg shadow-lg w-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export function BookTOC() {
 const { bookId } = useParams({ from: '/books/$bookId' });

 const { data: metadata, isLoading, error } = useQuery({
  queryKey: ['bookMetadata', bookId],
  queryFn: () => fetchMetadata(bookId),
  enabled: !!bookId,
 });
 
 if (error) return <div className="text-center text-destructive">Error: {error.message}</div>;

 // 3. MODIFIED: Return a skeleton layout while loading
 if (isLoading) {
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
      </div>
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        <Skeleton className="md:col-span-1 w-full aspect-[2/3] rounded-lg" />
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="pt-6 space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
 }

 return (
  <motion.div 
   className="container mx-auto max-w-4xl p-4 md:p-8"
   initial="hidden"
   animate="visible"
   variants={pageVariants}
  >
   <div>
    <Button asChild variant="link" className="p-0 mb-4 text-sm md:text-base">
     <Link to="/">&larr; Back to Library</Link>
    </Button>
   </div>

   <div className="grid md:grid-cols-3 gap-6 md:gap-8">
    <div className="md:col-span-1">
      <ImageWithLoader src={metadata?.coverUrl || ''} alt={`Cover of ${metadata?.title}`} />
    </div>

    <div className="md:col-span-2">
     <Card className="bg-card/50">
      <CardHeader>
       <CardTitle className="text-3xl font-bold md:text-4xl">{metadata?.title}</CardTitle>
       <CardDescription className="text-base md:text-lg">by {metadata?.author}</CardDescription>
      </CardHeader>
      <CardContent>
       <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Chapters</h3>
       <ul className="space-y-2">
        {metadata?.chapters.map((chapter) => (
         <li key={chapter.number}>
          <MotionButton 
           asChild 
           variant="link" 
           className="p-0 text-base h-auto justify-start"
          >
           <Link 
            to="/books/$bookId/chapter/$chapterNumber" 
            params={{ bookId, chapterNumber: String(chapter.number) }}
           >
            {chapter.title}
           </Link>
          </MotionButton>
         </li>
        ))}
       </ul>
      </CardContent>
     </Card>
    </div>
   </div>
  </motion.div>
 );
}