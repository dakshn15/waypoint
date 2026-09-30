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
import { addVendor } from "@/app/actions/vendors";
import { serializePrisma } from "@/lib/utils";

const CATEGORIES = [
  "Hotel",
  "Transport",
  "Restaurant",
  "Activity",
  "Guide",
  "Other",
];

interface AddVendorDialogProps {
  agencyId: string;
  onVendorAdded?: (vendor: any) => void;
}

export default function AddVendorDialog({ agencyId, onVendorAdded }: AddVendorDialogProps) {
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
      toast.error("Vendor name is required.");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Location is required.");
      return;
    }

    // Validate email format if provided
    if (form.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.contactEmail.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
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

        // Optimistically add the new vendor to the list
        if (result.vendor && onVendorAdded) {
          onVendorAdded(serializePrisma(result.vendor));
        }

        setForm({
          name: "",
          category: "HOTEL",
          location: "",
          contactEmail: "",
          contactPhone: "",
          description: "",
        });
      }
    } catch (err) {
      toast.error("Failed to add vendor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button />
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
            <Label htmlFor="vendor-name">Vendor Name <span className="text-rose-500">*</span></Label>
            <Input
              id="vendor-name"
              placeholder="e.g., Taj Hotels"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Category <span className="text-rose-500">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`p-2 rounded-md border text-sm font-medium transition-all cursor-pointer ${
                    form.category === cat.toUpperCase()
                      ? "border-[var(--waypoint-teal)] bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)]"
                      : "border-border hover:border-[var(--waypoint-teal)]/50 text-muted-foreground"
                  }`}
                  onClick={() => setForm({ ...form, category: cat.toUpperCase() })}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-location">Location <span className="text-rose-500">*</span></Label>
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

