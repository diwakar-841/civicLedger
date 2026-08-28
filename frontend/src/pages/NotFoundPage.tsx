import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/shared/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-6 text-center text-white">
      <Compass className="h-10 w-10 text-gold-400" />
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="max-w-sm text-navy-300">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>
  );
}
