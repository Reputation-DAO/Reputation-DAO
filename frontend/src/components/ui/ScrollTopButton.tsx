import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const ScrollTopButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setShow(y > 400);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_10px_30px_rgba(0,102,255,0.4)] hover:shadow-[0_10px_40px_rgba(0,102,255,0.6)] transition-shadow grid place-items-center"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollTopButton;
