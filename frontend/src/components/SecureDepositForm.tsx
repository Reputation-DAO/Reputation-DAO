import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Rail = 'ICP' | 'BTC' | 'ETH';

type DepositStatus = 'Pending' | 'Verified' | 'Failed' | 'Expired';

type PendingDeposit = {
  id: number;
  org: string;
  rail: Rail;
  amount: number;
  memo?: string;
  expectedAccount: string;
  submittedAt: number;
  verificationAttempts: number;
  status: DepositStatus;
};

type DepositAccount = {
  owner: string;
  subaccount: string;
  accountId: string;
};

interface SecureDepositFormProps {
  orgId: string;
  treasuryActor: any; // Treasury canister actor
  onDepositVerified?: (deposit: PendingDeposit) => void;
}

export function SecureDepositForm({ orgId, treasuryActor, onDepositVerified }: SecureDepositFormProps) {
  const [rail, setRail] = useState<Rail>('ICP');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositAccount, setDepositAccount] = useState<DepositAccount | null>(null);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);

  // Load deposit account and pending deposits
  useEffect(() => {
    loadDepositAccount();
    loadPendingDeposits();
  }, [rail, orgId]);

  const loadDepositAccount = async () => {
    try {
      const account = await treasuryActor.getDepositAccount(orgId, { [rail]: null });
      setDepositAccount(account);
    } catch (error) {
      console.error('Failed to load deposit account:', error);
      toast.error('Failed to load deposit account');
    }
  };

  const loadPendingDeposits = async () => {
    try {
      const deposits = await treasuryActor.getPendingDeposits(orgId);
      setPendingDeposits(deposits);
    } catch (error) {
      console.error('Failed to load pending deposits:', error);
    }
  };

  const submitDepositClaim = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Convert amount to e8s for ICP/ckBTC/ckETH
      const amountE8s = Math.floor(parseFloat(amount) * 100_000_000);
      
      const depositId = await treasuryActor.submitDepositClaim(
        orgId,
        { [rail]: null },
        amountE8s,
        memo ? [memo] : []
      );

      toast.success(`Deposit claim submitted! ID: ${depositId}`);
      
      // Reset form
      setAmount('');
      setMemo('');
      
      // Reload pending deposits
      await loadPendingDeposits();
      
      // Start polling for verification
      pollDepositStatus(depositId);
      
    } catch (error: any) {
      console.error('Failed to submit deposit claim:', error);
      toast.error(error.message || 'Failed to submit deposit claim');
    } finally {
      setLoading(false);
    }
  };

  const pollDepositStatus = async (depositId: number) => {
    const maxAttempts = 20; // Poll for ~2 minutes
    let attempts = 0;

    const poll = async () => {
      try {
        const deposit = await treasuryActor.getDepositStatus(depositId);
        if (deposit && deposit[0]) {
          const status = deposit[0].status;
          
          if (Object.keys(status)[0] === 'Verified') {
            toast.success('Deposit verified and credited!');
            onDepositVerified?.(deposit[0]);
            await loadPendingDeposits();
            return;
          } else if (Object.keys(status)[0] === 'Failed') {
            toast.error(`Deposit verification failed: ${Object.values(status)[0]}`);
            await loadPendingDeposits();
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 6000); // Poll every 6 seconds
        } else {
          toast.warning('Deposit verification is taking longer than expected. Check back later.');
          await loadPendingDeposits();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
  };

  const retryVerification = async (depositId: number) => {
    try {
      const success = await treasuryActor.retryDepositVerification(depositId);
      if (success) {
        toast.success('Verification retry successful!');
      } else {
        toast.warning('Verification retry failed - transaction may not be confirmed yet');
      }
      await loadPendingDeposits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to retry verification');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const getStatusIcon = (status: DepositStatus) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Expired':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: DepositStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Secure Treasury Deposit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Asset</label>
              <Select value={rail} onValueChange={(value: Rail) => setRail(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICP">ICP</SelectItem>
                  <SelectItem value="BTC">ckBTC</SelectItem>
                  <SelectItem value="ETH">ckETH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.00000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Memo (optional)</label>
            <Input
              placeholder="Transaction memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* Deposit Instructions */}
          {depositAccount && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Step 1: Send {rail} to this treasury account:</p>
                  
                  <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Owner:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-xs">
                          {depositAccount.owner.slice(0, 20)}...
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(depositAccount.owner, 'Owner')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Account ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-xs">
                          {depositAccount.accountId.slice(0, 20)}...
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(depositAccount.accountId, 'Account ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="font-medium">Step 2: Record the deposit below after sending:</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={submitDepositClaim} 
            disabled={loading || !amount}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Record Deposit & Verify'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDeposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deposit.status)}
                    <div>
                      <div className="font-medium">
                        {(deposit.amount / 100_000_000).toFixed(8)} {deposit.rail}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {deposit.id} • {new Date(deposit.submittedAt * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(deposit.status)}>
                      {deposit.status}
                    </Badge>
                    
                    {deposit.status === 'Pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryVerification(deposit.id)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
