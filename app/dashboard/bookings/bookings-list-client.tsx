"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, User as UserIcon, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { cancelBooking, updateBookingStatus } from "@/app/actions/bookings";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

interface BookingsListClientProps {
  initialBookings: any[];
  role: string;
}

export default function BookingsListClient({ initialBookings, role }: BookingsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<"CANCEL" | "CONFIRM" | "REJECT" | null>(null);
  const [loading, setLoading] = useState(false);

  // Verify Stripe payment on mount if session_id and bookingId are in query parameters
  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("bookingId");

    if (payment === "success" && sessionId && bookingId) {
      async function verifyStripePayment() {
        const toastId = toast.loading("Verifying Stripe payment...");
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gateway: "stripe",
              sessionId,
              bookingId,
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success("Payment verified! Booking confirmed.", { id: toastId });

            // Instantly update local state to show as CONFIRMED
            setBookings((prev) =>
              prev.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED" } : b))
            );

            // Clean up the URL search params so refresh doesn't trigger verification again
            const params = new URLSearchParams(window.location.search);
            params.delete("payment");
            params.delete("session_id");
            params.delete("bookingId");
            const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
            window.history.replaceState(null, "", newUrl);

            router.refresh();
          } else {
            toast.error(data.error || "Payment verification failed.", { id: toastId });
          }
        } catch (err) {
          toast.error("Failed to verify Stripe payment.", { id: toastId });
        }
      }
      verifyStripePayment();
    }
  }, [searchParams, router]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15";
      case "COMPLETED":
        return "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15";
      case "PENDING":
        return "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15";
      case "PROCESSING":
        return "bg-[#E8AA9B]/10 text-[#C85A35] border border-[#E8AA9B]/20 hover:bg-[#E8AA9B]/15";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/10";
      case "REFUNDED":
        return "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  async function handleCancel(bookingId: string) {
    setLoading(true);
    try {
      const updated = await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b))
      );
      toast.success("Booking cancelled successfully.");
      setSelectedBooking(null);
      setDialogMode(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(bookingId: string, status: any) {
    setLoading(true);
    try {
      const updated = await updateBookingStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b))
      );
      toast.success(`Booking status updated to ${status.toLowerCase()}.`);
      setSelectedBooking(null);
      setDialogMode(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50">
              <TableHead className="w-[120px]">Booking ID</TableHead>
              <TableHead>Package / Trip</TableHead>
              <TableHead>{role === "AGENCY" || role === "STAFF" ? "Traveler" : "Agency"}</TableHead>
              <TableHead>Travel Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const isPendingOrConfirmed = ["PENDING", "CONFIRMED", "PROCESSING"].includes(booking.status);
              const isAgencyOrStaffOrAdmin = ["AGENCY", "STAFF", "ADMIN"].includes(role);

              return (
                <TableRow key={booking.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <TableCell className="font-mono text-xs font-semibold">
                    {booking.bookingNumber ? booking.bookingNumber.substring(0, 8).toUpperCase() : booking.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-slate-900">
                      {booking.package ? booking.package.title : "Custom AI Trip Plan"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.travelers.length} traveler{booking.travelers.length > 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {isAgencyOrStaffOrAdmin ? (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.user?.name || "Traveler"}</span>
                      </div>
                    ) : (
                      <span>{booking.agency ? booking.agency.name : "Waypoint Direct"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(booking.travelDate)}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-slate-900">
                    {formatCurrency(Number(booking.totalAmount), booking.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wider", getStatusStyle(booking.status))}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Traveler Cancellation */}
                      {!isAgencyOrStaffOrAdmin && isPendingOrConfirmed && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-lg text-xs"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setDialogMode("CANCEL");
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )}

                      {/* Agency Actions */}
                      {isAgencyOrStaffOrAdmin && booking.status === "PENDING" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20 hover:border-secondary/40 rounded-lg text-xs"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDialogMode("CONFIRM");
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-lg text-xs"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDialogMode("REJECT");
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Complete action for verified tours in processing */}
                      {isAgencyOrStaffOrAdmin && ["CONFIRMED", "PROCESSING"].includes(booking.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs hover:bg-slate-100 border-slate-200"
                          onClick={() => {
                            handleStatusUpdate(booking.id, "COMPLETED");
                          }}
                        >
                          Mark Completed
                        </Button>
                      )}

                      {!isPendingOrConfirmed && booking.status !== "PENDING" && (
                        <span className="text-xs text-muted-foreground italic">No actions</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      {selectedBooking && dialogMode && (
        <Dialog open={true} onOpenChange={() => { if (!loading) { setSelectedBooking(null); setDialogMode(null); } }}>
          <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                {dialogMode === "CANCEL" && (
                  <>
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    Cancel Booking
                  </>
                )}
                {dialogMode === "CONFIRM" && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    Confirm Booking
                  </>
                )}
                {dialogMode === "REJECT" && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Reject Booking
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-sm">
                {dialogMode === "CANCEL" && (
                  "Are you sure you want to cancel your booking? This action will set your status to CANCELLED and notify the travel agency."
                )}
                {dialogMode === "CONFIRM" && (
                  "Confirming this booking notifies the customer that their tour package has been verified and scheduled. Do you want to proceed?"
                )}
                {dialogMode === "REJECT" && (
                  "Rejecting this booking will cancel the request and notify the traveler. This action is permanent."
                )}
              </DialogDescription>
            </DialogHeader>

            {dialogMode === "CANCEL" && (
              <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-2 text-xs text-orange-800">
                <h4 className="font-semibold flex items-center gap-1.5 text-orange-900 text-sm">
                  Cancellation & Refund Policy
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-orange-800 leading-relaxed">
                  <li><strong>Free Cancellation:</strong> Full refund is guaranteed for cancellations made within 48 hours of booking.</li>
                  <li><strong>Standard Fee:</strong> A 15% cancellation fee applies if cancelled after 48 hours but before 7 days of departure.</li>
                  <li><strong>Late Cancellation:</strong> No refund is processed for cancellations within 7 days of departure.</li>
                  <li><strong>Automated Refunds:</strong> Approved refunds will be automatically credited to your original payment method (Stripe/Razorpay) within 5–7 business days.</li>
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" disabled={loading} onClick={() => { setSelectedBooking(null); setDialogMode(null); }}>
                Go Back
              </Button>
              {dialogMode === "CANCEL" && (
                <Button
                  variant="destructive"
                  disabled={loading}
                  onClick={() => handleCancel(selectedBooking.id)}
                >
                  {loading ? "Cancelling..." : "Yes, Cancel Booking"}
                </Button>
              )}
              {dialogMode === "CONFIRM" && (
                <Button
                  className="bg-secondary hover:bg-secondary/90 text-white"
                  disabled={loading}
                  onClick={() => handleStatusUpdate(selectedBooking.id, "CONFIRMED")}
                >
                  {loading ? "Confirming..." : "Yes, Confirm Booking"}
                </Button>
              )}
              {dialogMode === "REJECT" && (
                <Button
                  variant="destructive"
                  disabled={loading}
                  onClick={() => handleStatusUpdate(selectedBooking.id, "CANCELLED")}
                >
                  {loading ? "Rejecting..." : "Yes, Reject Booking"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
