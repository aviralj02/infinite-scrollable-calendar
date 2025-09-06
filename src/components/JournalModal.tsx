import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { parseDDMMYYYY } from "../lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  journals: Array<Journal>;
  initialIndex: number;
};

const JournalModal = ({ initialIndex, isOpen, journals, onClose }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
  });

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi && isOpen) {
      emblaApi.scrollTo(initialIndex, true);
      setCurrentIndex(initialIndex);
    }
  }, [emblaApi, initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          scrollPrev();
          break;
        case "ArrowRight":
          scrollNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, scrollPrev, scrollNext]);

  if (!isOpen) return null;

  const currentJournal = journals[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl h-5/6 mx-4 bg-transparent rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {journals.map((journal) => (
              <div
                key={journal.date}
                className="flex-[0_0_85%] min-w-0 max-w-lg"
              >
                <div className="w-full max-h-2/6 overflow-hidden bg-gray-100">
                  <img
                    src={journal.imgUrl}
                    alt={`Journal entry for ${journal.date}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="bg-white p-4 flex flex-col gap-4 h-full sm:text-base text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {new Date(
                        parseDDMMYYYY(currentJournal.date)
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < currentJournal.rating
                              ? "text-[#4d90ff] fill-current"
                              : "text-[#b4c1d6]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="leading-snug">{journal.description}</p>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {journal.categories.map((category) => (
                        <span
                          key={category}
                          className="px-3 py-1 bg-blue-100 text-blue-800 font-medium rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {journals.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-lg transition-all duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollNext}
              disabled={currentIndex === journals.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-lg transition-all duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JournalModal;
