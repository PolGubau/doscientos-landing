import { useState, type FormEvent } from "react";

interface NewsletterInputProps {
  className?: string;
}

export default function NewsletterInput({ className = "" }: NewsletterInputProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form className="flex flex-col sm:flex-row gap-3 max-w-md" onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email" className="sr-only">
        Email para newsletter
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="tu@email.com"
        className={`min-h-11 flex-1 rounded-full border border-background/10 px-4 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-background/60 ${className}`}
      />
      <button
        type="submit"
        className="min-h-11 rounded-full bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background/90 focus:outline-none focus:ring-2 focus:ring-background/60"
      >
        {submitted ? "Recibido" : "Enviar"}
      </button>
    </form>
  );
}
