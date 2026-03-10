import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, IndianRupee, Download } from "lucide-react";

interface PricingTier {
  id: string;
  tier_name: string;
  lbc_price: number;
  hpv_price: number;
  co_test_price: number;
}

const PricingTiers = () => {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/pricing-tiers");
        if (!response.ok) throw new Error("Server error");
        const data = await response.json();
        if (Array.isArray(data)) {
          setTiers(data);
        } else {
          setError("Data format is incorrect.");
        }
      } catch (err) {
        setError("Failed to load pricing data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  const exportToCSV = () => {
    if (tiers.length === 0) return;

    const headers = [
      "ID",
      "Tier Name",
      "LBC Price",
      "HPV Price",
      "CO-Test Price",
    ];
    const rows = tiers.map((tier) => [
      tier.id,
      `"${tier.tier_name}"`,
      tier.lbc_price,
      tier.hpv_price,
      tier.co_test_price,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pricing_tiers_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-600" />
          Active Pricing Tiers
        </CardTitle>

        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={tiers.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>

      <CardContent>
        {error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-slate-900">
                  Tier Name
                </TableHead>
                <TableHead className="font-bold text-slate-900 text-right">
                  LBC Price
                </TableHead>
                <TableHead className="font-bold text-slate-900 text-right">
                  HPV Price
                </TableHead>
                <TableHead className="font-bold text-slate-900">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.length > 0 ? (
                tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium text-blue-700">
                      {tier.tier_name}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(tier.lbc_price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(tier.hpv_price).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-slate-400"
                  >
                    No pricing tiers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingTiers;
