'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  trigger: React.ReactNode;
}

export function ImageLightbox({ images, initialIndex = 0, trigger }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  function prev() {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }

  function next() {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }

  return (
    <Dialog.Root onOpenChange={() => setIndex(initialIndex)}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
        </Dialog.Overlay>
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <Dialog.Close className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </Dialog.Close>

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.img
              key={index}
              src={images[index]}
              alt={`Image ${index + 1}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === index ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
