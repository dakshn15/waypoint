"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TRAVELER" | "AGENCY">("TRAVELER");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await signUp.email({
      name,
      email,
      password,
      role,
    } as any, {
      onSuccess: async () => {
        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || "Something went wrong");
        setLoading(false);
      }
    });
  };

  return (
    <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-none animate-in fade-in zoom-in-95 duration-500">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-dm-sans">Create an account</CardTitle>
        <CardDescription>
          Join Waypoint to plan, book, or manage travel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <button 
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${role === "TRAVELER" ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("TRAVELER")}
          >
            I&apos;m a Traveler
          </button>
          <button 
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${role === "AGENCY" ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("AGENCY")}
          >
            I&apos;m an Agency
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{role === "TRAVELER" ? "Full Name" : "Agency Name"}</Label>
            <Input 
              id="name" 
              placeholder="John Doe" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/50 dark:bg-black/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/50 dark:bg-black/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/50 dark:bg-black/50"
            />
          </div>
          <Button type="submit" className="w-full bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
        
      </CardContent>
      <CardFooter className="flex flex-col gap-4 text-center">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--waypoint-teal)] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
