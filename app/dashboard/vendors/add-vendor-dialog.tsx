"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addVendor } from "@/app/actions/vendors";

const CATEGORIES = [
  "HOTEL",
  "TRANSPORT",
  "RESTAURANT",
  "ACTIVITY",
  "GUIDE",
  "OTHER",
];

export default function AddVendorDialog({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "HOTEL",
    location: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    setLoading(true);
    try {
      const result = await addVendor({
        agencyId,
        ...form,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Vendor added successfully!");
        setOpen(false);
        setForm({
          name: "",
          category: "HOTEL",
          location: "",
          contactEmail: "",
          contactPhone: "",
          description: "",
        });
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-gradient-to-r from-[var(--waypoint-teal)] to-sky-500 text-white gap-2 rounded-full px-6" />
        }
      >
        <Plus className="h-4 w-4" /> Add Vendor
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a hotel, transport, or service partner to your vendor network.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">Vendor Name *</Label>
            <Input
              id="vendor-name"
              placeholder="e.g., Taj Hotels"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    form.category === cat
                      ? "border-[var(--waypoint-teal)] bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)]"
                      : "border-border hover:border-[var(--waypoint-teal)]/50 text-muted-foreground"
                  }`}
                  onClick={() => setForm({ ...form, category: cat })}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-location">Location</Label>
            <Input
              id="vendor-location"
              placeholder="e.g., Mumbai, India"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-email">Email</Label>
              <Input
                id="vendor-email"
                type="email"
                placeholder="vendor@email.com"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input
                id="vendor-phone"
                placeholder="+91 ..."
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-desc">Description</Label>
            <Input
              id="vendor-desc"
              placeholder="Brief description of services..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Vendor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
