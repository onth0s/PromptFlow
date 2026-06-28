'use client';

import React, { useEffect, useState } from 'react';
import { getImage } from '@/lib/images';

interface LocalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageId: string;
}

export const LocalImage: React.FC<LocalImageProps> = ({ imageId, alt = 'Stored asset', className = '', ...props }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function load() {
      setError(false);
      const blob = await getImage(imageId);
      if (!active) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } else {
        setError(true);
      }
    }

    load();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded text-xs select-none border border-zinc-200 dark:border-zinc-700 p-2 ${className}`}>
        Image unavailable
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`} />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} {...props} />;
};
