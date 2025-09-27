import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'retry';

const PaymentSuccessPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice_id');
    const offerId = urlParams.get('offer_id');
    const projectId = urlParams.get('project_id');
    const status = urlParams.get('status');

    console.log('Payment success page loaded with params:', {
      invoiceId,
      offerId,
      projectId,
      status,
      allParams: Object.fromEntries(urlParams.entries())
    });

    if (invoiceId) {
      // If we have invoice_id, we can verify the payment
      // For now, we'll need to get offer_id from the invoice metadata
      verifyAndProcessPayment(invoiceId, offerId || '', projectId);
    } else {
      setStatus('failed');
      setError('معرف الفاتورة غير موجود في الرابط');
    }
  }, []);

  const verifyAndProcessPayment = async (invoiceId: string, offerId: string, projectId?: string | null) => {
    try {
      setStatus('verifying');
      setError(null);

      console.log('🔍 بدء التحقق من الدفع:', { invoiceId, offerId, projectId });

      // If we don't have offerId, we need to get it from the invoice metadata
      let finalOfferId = offerId;
      if (!finalOfferId) {
        try {
          // Get invoice details to extract offer_id from metadata
          const MoyasarService = (await import('../../lib/moyasarService')).default;
          const moyasarService = new MoyasarService();
          const invoice = await moyasarService.getInvoice(invoiceId);
          finalOfferId = invoice.metadata?.offer_id;
          console.log('📋 تم استخراج offer_id من metadata:', finalOfferId);
        } catch (metadataError) {
          console.error('❌ فشل في استرجاع metadata:', metadataError);
          // Continue without offerId - the backend can handle this
        }
      }

      if (!finalOfferId) {
        console.log('⚠️ لم يتم العثور على offer_id، سيتم المتابعة بدون معرف العرض');
        // Don't throw error, let backend handle it
      }

      const response = await apiRequest('POST', '/api/payment/verify-success', {
        invoiceId,
        offerId: finalOfferId,
        projectId
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ تم التحقق من الدفع بنجاح:', data);
        
        setStatus('success');
        setVerificationData(data);

        toast({
          title: "تم الدفع بنجاح! 🎉",
          description: "تم دفع عمولة المنصة بنجاح. يمكنك الآن التواصل مع الشركة مباشرة.",
          duration: 5000,
        });

        // Redirect to project page after 3 seconds
        setTimeout(() => {
          if (data.projectId) {
            navigate(`/projects/${data.projectId}?payment=success&offerId=${offerId}`);
          } else {
            navigate('/dashboard?payment=success');
          }
        }, 3000);

      } else {
        const errorData = await response.json();
        console.error('❌ فشل التحقق من الدفع:', errorData);
        
        setStatus('failed');
        setError(errorData.message || 'فشل في التحقق من الدفع');
      }

    } catch (error: any) {
      console.error('❌ خطأ في التحقق من الدفع:', error);
      
      setStatus('failed');
      setError(error.message || 'حدث خطأ أثناء التحقق من الدفع');
    }
  };

  const handleRetry = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice_id');
    const offerId = urlParams.get('offer_id');
    const projectId = urlParams.get('project_id');

    if (invoiceId && offerId) {
      setRetryCount(prev => prev + 1);
      verifyAndProcessPayment(invoiceId, offerId, projectId);
    }
  };

  const handleManualRedirect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');
    const offerId = urlParams.get('offer_id');

    if (projectId) {
      navigate(`/projects/${projectId}?payment=success&offerId=${offerId}`);
    } else {
      navigate('/dashboard?payment=success');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">جاري التحقق من الدفع...</h2>
            <p className="text-gray-600">
              يرجى الانتظار بينما نتحقق من حالة الدفع مع Moyasar
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                محاولة التحقق رقم {retryCount + 1}
              </p>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-2 text-green-800">تم الدفع بنجاح! 🎉</h2>
            <p className="text-gray-600 mb-4">
              تم دفع عمولة المنصة بنجاح. يمكنك الآن التواصل مع الشركة مباشرة.
            </p>
            {verificationData && (
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-700">
                  <strong>مبلغ الدفع:</strong> {verificationData.amount} ريال سعودي
                </p>
                <p className="text-sm text-green-700">
                  <strong>معرف العرض:</strong> {verificationData.offerId}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">
              سيتم توجيهك إلى صفحة المشروع خلال لحظات...
            </p>
            <Button onClick={handleManualRedirect} className="bg-green-600 hover:bg-green-700">
              الانتقال الآن
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold mb-2 text-red-800">فشل التحقق من الدفع</h2>
            <p className="text-gray-600 mb-4">
              {error || 'لم نتمكن من التحقق من حالة الدفع'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleRetry} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={retryCount >= 3}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
              {retryCount >= 3 && (
                <div className="text-sm text-gray-500">
                  <p>تم تجاوز عدد المحاولات المسموح. يرجى:</p>
                  <Button 
                    onClick={handleManualRedirect} 
                    variant="outline" 
                    className="mt-2"
                  >
                    الانتقال إلى المشروع
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">حالة الدفع</CardTitle>
          <CardDescription className="text-center">
            {status === 'verifying' && 'جاري التحقق من الدفع...'}
            {status === 'success' && 'تم الدفع بنجاح'}
            {status === 'failed' && 'فشل التحقق من الدفع'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
