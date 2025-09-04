import { Loader2, Star } from "lucide-react";
import { useState } from "react";

type Props = {
  journal: Journal;
  dateKey: string;
};

const JournalOverlay = ({ journal, dateKey }: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute sm:inset-2 inset-0 rounded-md overflow-hidden flex items-end">
      {!isLoaded && (
        <div className="absolute flex items-center justify-center w-full h-full bg-gray-200 text-black z-10">
          <Loader2 className="animate-spin spin w-4 h-4" />
        </div>
      )}

      <img
        src={journal.imgUrl}
        alt={`Journal for ${dateKey}`}
        className="w-[200px] sm:h-[120px] h-[90px] object-cover opacity-80 hover:opacity-100 transition-opacity duration-200"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="hidden sm:flex absolute bottom-1 left-1 items-center gap-1 w-full">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-2.5 h-2.5 text-white`}
            fill={`${i < journal.rating ? "#4d90ff" : "#b4c1d6"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default JournalOverlay;
