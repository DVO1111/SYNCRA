import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Filter, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TaxRecord {
  id: number;
  payer_id: string;
  wallet_address: string;
  tax_type: string;
  tax_amount: number;
  income_amount: number;
  transaction_id: string;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'cancelled';
  service_fee: number;
  net_amount: number;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function TaxProcessing() {
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadRecords();
  }, [statusFilter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const url = `${SUPABASE_URL}/functions/v1/process-tax?status=${statusFilter}&limit=100`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
      } else {
        throw new Error(data.error || 'Failed to load records');
      }
    } catch (error) {
      console.error('Error loading tax records:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load tax processing records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-tax`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status: newStatus, notes })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Status Updated",
          description: `Tax record status updated to ${newStatus}`,
        });
        loadRecords();
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      processed: "default",
      processing: "secondary",
      pending: "outline",
      failed: "destructive",
      cancelled: "destructive"
    };

    const icons: Record<string, typeof CheckCircle2> = {
      processed: CheckCircle2,
      processing: Clock,
      pending: Clock,
      failed: XCircle,
      cancelled: XCircle
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRecords = records.filter(record => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.payer_id.toLowerCase().includes(searchLower) ||
        record.wallet_address.toLowerCase().includes(searchLower) ||
        record.transaction_id.toLowerCase().includes(searchLower) ||
        record.tax_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tax Processing</h1>
        <p className="text-muted-foreground">Manage and process tax payment records</p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Payer ID, Wallet, or Transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadRecords} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <CardTitle>Tax Processing Records</CardTitle>
            <Badge variant="outline">{filteredRecords.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading records...</p>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tax processing records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Payer ID</TableHead>
                    <TableHead>Tax Type</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Service Fee</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">
                        {record.transaction_id}
                      </TableCell>
                      <TableCell>{record.payer_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.tax_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>₦{record.tax_amount.toLocaleString()}</TableCell>
                      <TableCell>₦{record.service_fee.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ₦{record.net_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {record.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(record.id, 'processing')}
                              >
                                Process
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus(record.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {record.status === 'processing' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(record.id, 'processed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

