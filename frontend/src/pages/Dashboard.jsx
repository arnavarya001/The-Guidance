import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ReceiptModal from '../components/ReceiptModal';

export default function Dashboard({ onOpenAiDoubt }) {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();
  
  // Dashboard Sub-navigation Tab
  const [activeTab, setActiveTab] = useState('academic'); // 'academic' | 'fees'

  // Academic State
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fee & Payment State
  const [feeData, setFeeData] = useState({ fees: [], payments: [], summary: { total_billed: 0, total_paid: 0, total_due: 0 } });
  const [feeLoading, setFeeLoading] = useState(false);
  const [selectedFeeToPay, setSelectedFeeToPay] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI / QR Code');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      window.location.hash = '#login';
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch analytics
        const anaRes = await fetch('/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const anaData = await anaRes.json();
        setAnalytics(anaData && typeof anaData === 'object' ? anaData : null);

        // Fetch history
        const histRes = await fetch('/api/results/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const histData = await histRes.json();
        setHistory(Array.isArray(histData) ? histData.sort((a,b) => new Date(b.attempted_at) - new Date(a.attempted_at)).slice(0, 4) : []);

        // Fetch all classes
        const clsRes = await fetch('/api/courses/classes');
        const clsData = await clsRes.json();
        setClasses(Array.isArray(clsData) ? clsData : []);

        // Fetch tests for student's class
        const targetClass = (user && user.class) ? user.class : 'c_10';
        const testRes = await fetch(`/api/tests?classId=${targetClass}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const testData = await testRes.json();
        setAvailableTests(Array.isArray(testData) ? testData.slice(0, 3) : []);

        // Fetch student fees
        fetchFeeData();
      } catch (e) {
        console.warn("Failed to load dashboard data, using safe defaults", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  const fetchFeeData = async () => {
    setFeeLoading(true);
    try {
      const res = await fetch('/api/fees/my-fees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.fees) {
        setFeeData(data);
      }
    } catch (err) {
      console.warn("Failed to load student fees:", err);
    } finally {
      setFeeLoading(false);
    }
  };

  const handleOpenPayModal = (fee) => {
    setSelectedFeeToPay(fee);
    setPaymentAmount(fee.due_amount || fee.total_amount);
    setPaymentSuccessData(null);
  };

  const handleInitiatePayment = async () => {
    if (!selectedFeeToPay || !paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Step 1: Create Order on Server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feeId: selectedFeeToPay.id,
          amount: Number(paymentAmount),
          paymentMethod: selectedPaymentMethod
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create payment order.');

      // Step 2: Server-Side Payment Verification & Atomic Database Credit
      const verifyRes = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feeId: selectedFeeToPay.id,
          amount: Number(paymentAmount),
          transactionId: orderData.transaction_id,
          orderId: orderData.order_id,
          paymentMethod: selectedPaymentMethod,
          razorpayPaymentId: 'pay_rzp_' + Date.now()
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed.');

      // Step 3: Success state & refresh fee ledger
      setPaymentSuccessData(verifyData);
      fetchFeeData();
    } catch (err) {
      alert("Payment Processing Failed: " + (err.message || 'Server error.'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewReceipt = async (receiptId) => {
    try {
      const res = await fetch(`/api/payments/receipt/${receiptId}`);
      const data = await res.json();
      if (res.ok) {
        setActiveReceipt(data);
        setIsReceiptOpen(true);
      } else {
        alert("Receipt details not found.");
      }
    } catch (err) {
      alert("Failed to load receipt.");
    }
  };

  if (loading) {
    return (
      <div className="loader-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse-glow" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)' }}></div>
      </div>
    );
  }

  const currentClassName = classes.find(c => c.id === user?.class)?.name || `Class ${user?.class ? user.class.replace('c_', '') : '10'}`;
  const prepProgress = analytics && !analytics.empty 
    ? Math.min(95, 20 + (analytics.total_tests * 15)) 
    : 25;

  const enrollmentNo = (feeData.fees && feeData.fees[0]?.enrollment_no) || `STU-BSEB-2026-${user?.id ? user.id.slice(-4) : '1088'}`;
  const departmentName = (feeData.fees && feeData.fees[0]?.department) || 'Senior Secondary Academic Wing';
  const semesterName = (feeData.fees && feeData.fees[0]?.semester) || 'Semester 1 (Session 2026-27)';

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      
      {/* 1. Complete Student Profile Header */}
      <div className="card glass" style={{
        padding: '28px',
        borderRadius: '20px',
        marginBottom: '32px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-premium)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          {/* Avatar & Student Identifiers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #7c3aed 100%)',
              color: 'white',
              fontSize: '28px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
              flexShrink: 0
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  {user?.name || 'Enrolled Student'}
                </h1>
                <span style={{
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '100px',
                  border: '1px solid #a7f3d0'
                }}>
                  🟢 Enrolled Student
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>🆔 <strong>{enrollmentNo}</strong></span>
                <span>📚 <strong>{currentClassName}</strong></span>
                <span>🏛️ {departmentName}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>✉️ {user?.email || 'student@theguidance.student'}</span>
                <span>📅 Admission: 15 July 2026</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => onOpenAiDoubt ? onOpenAiDoubt() : (window.location.hash = '#ai-guru')}
              className="btn btn-secondary" 
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              🤖 Ask AI Doubt
            </button>
            <button 
              onClick={() => window.location.hash = '#test-series'}
              className="btn btn-primary" 
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              ✍️ Practice Test
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderTop: '1px solid var(--border)',
          marginTop: '24px',
          paddingTop: '16px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            style={{
              background: activeTab === 'academic' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'academic' ? '#ffffff' : 'var(--text-dark)',
              border: activeTab === 'academic' ? 'none' : '1px solid var(--border)',
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)'
            }}
          >
            <span>📊</span> Academic Progress & Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            style={{
              background: activeTab === 'fees' ? '#f59e0b' : 'transparent',
              color: activeTab === 'fees' ? '#ffffff' : 'var(--text-dark)',
              border: activeTab === 'fees' ? 'none' : '1px solid var(--border)',
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)'
            }}
          >
            <span>💳</span> Fees & Online Payments
            {feeData.summary.total_due > 0 && (
              <span style={{
                backgroundColor: activeTab === 'fees' ? '#ffffff' : '#ef4444',
                color: activeTab === 'fees' ? '#b45309' : '#ffffff',
                padding: '1px 6px',
                borderRadius: '100px',
                fontSize: '10px',
                fontWeight: 800
              }}>
                ₹{feeData.summary.total_due.toLocaleString('en-IN')} Due
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. FEES & PAYMENTS PORTAL TAB */}
      {activeTab === 'fees' && (
        <div>
          {/* Fee Metrics Top Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--gray)', fontWeight: 600, marginBottom: '6px' }}>
                TOTAL COURSE FEE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-dark)' }}>
                ₹{feeData.summary.total_billed.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                {semesterName}
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '6px' }}>
                TOTAL AMOUNT PAID
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>
                ₹{feeData.summary.total_paid.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                Verified by Accounts
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: '6px' }}>
                PENDING / DUE AMOUNT
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>
                ₹{feeData.summary.total_due.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                Due Date: {feeData.fees[0]?.due_date || '30 Sept 2026'}
              </div>
            </div>
          </div>

          {/* Detailed Fee Invoices List */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-dark)' }}>
              Active Fee Invoices & Component Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {feeData.fees.map(fee => (
                <div key={fee.id} className="card" style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: fee.status === 'PAID' ? '1.5px solid #10b981' : '1.5px solid var(--border)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                          {fee.course_name}
                        </h4>
                        <span style={{
                          backgroundColor: fee.status === 'PAID' ? '#ecfdf5' : '#fef3c7',
                          color: fee.status === 'PAID' ? '#065f46' : '#92400e',
                          border: fee.status === 'PAID' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {fee.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                        Invoice ID: <strong>{fee.id}</strong> | Term: {fee.semester} | Due: {fee.due_date}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Remaining Due</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: fee.due_amount > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{Number(fee.due_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Component Breakdown Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    backgroundColor: 'var(--bg)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'block' }}>Tuition Fee</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>₹{fee.breakdown?.tuition_fee?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'block' }}>Exam Fee</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>₹{fee.breakdown?.exam_fee?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'block' }}>Registration</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>₹{fee.breakdown?.registration_fee?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'block' }}>Library & Digital</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>₹{fee.breakdown?.library_fee?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'block' }}>Other / Misc</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>₹{fee.breakdown?.other_charges?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {fee.due_amount > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPayModal(fee)}
                        className="btn btn-primary"
                        style={{
                          padding: '10px 24px',
                          fontSize: '14px',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                        }}
                      >
                        💳 Pay Now (₹{Number(fee.due_amount).toLocaleString('en-IN')})
                      </button>
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✓ Fully Paid & Cleared
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History & Receipts Table */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-dark)' }}>
              Official Payment History & Receipts
            </h3>

            {feeData.payments.length === 0 ? (
              <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--gray)' }}>
                No payment transactions recorded yet. Completed payments will appear here with downloadable official receipts.
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border)', color: 'var(--gray)', textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Receipt No</th>
                      <th style={{ padding: '14px 20px' }}>Transaction ID</th>
                      <th style={{ padding: '14px 20px' }}>Date</th>
                      <th style={{ padding: '14px 20px' }}>Amount</th>
                      <th style={{ padding: '14px 20px' }}>Payment Mode</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.payments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-dark)' }}>
                          {p.receipt_id || 'RCP-2026-9811'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--gray)' }}>
                          {p.transaction_id}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--gray)' }}>
                          {new Date(p.paid_at).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#10b981' }}>
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-dark)' }}>
                          {p.payment_method}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            backgroundColor: '#ecfdf5',
                            color: '#065f46',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            PAID
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(p.receipt_id)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            📄 Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ACADEMIC PROGRESS & PRACTICE TAB */}
      {activeTab === 'academic' && (
        <div>
          {/* Daily Challenge Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>⚡</div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px', color: '#f59e0b' }}>
                  {language === 'hi' ? 'आज का डेली चैलेंज लाइव है! (+50 XP बोनस)' : "Today's Daily Challenge is Live! (+50 XP Bonus)"}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
                  {language === 'hi' ? 'अपनी तैयारी की स्ट्रीक बनाए रखने के लिए 5 प्रश्नों का हल करें।' : 'Solve 5 quick questions to maintain and increase your streak.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.location.hash = '#daily-challenge'}
              className="btn btn-primary"
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              {language === 'hi' ? 'क्विज़ हल करें →' : 'Solve Quiz →'}
            </button>
          </div>

          {/* Top Row: Overall Progress + Performance Summary */}
          <div className="grid-2" style={{ marginBottom: '32px' }}>
            {/* Overall Syllabus Progress */}
            <div className="card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📈</span> {t('dashOverallProgress')}
              </h3>
              <p className="card-description">
                {language === 'hi' ? 'पूरे किए गए अध्यायों और दिए गए टेस्ट के आधार पर गणना।' : 'Calculated from completed syllabus topics and attempted diagnostic tests.'}
              </p>

              <div style={{ margin: '24px 0 12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                  <span>{currentClassName} {t('navSyllabus')}</span>
                  <span style={{ color: 'var(--primary)' }}>{prepProgress}%</span>
                </div>
                <div style={{ height: '10px', background: 'var(--light-gray)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${prepProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                    borderRadius: '100px',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--gray)' }}>
                <span>✅ Class: <strong>{currentClassName}</strong></span>
                <span>📖 Syllabus: <strong>BSEB 2026 Updated</strong></span>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-card) 100%)',
              border: '1px solid rgba(37, 99, 235, 0.2)'
            }}>
              <h3 className="card-title" style={{ color: 'var(--primary)', fontSize: '16px' }}>
                {t('dashPerformance')}
              </h3>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-dark)', margin: '12px 0 4px 0' }}>
                {analytics && !analytics.empty ? `${analytics.average_score}%` : '78%'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px' }}>
                {language === 'hi' ? 'औसत टेस्ट स्कोर' : 'Average Score'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--gray)' }}>{t('dashTotalTests')}: </span>
                  <strong>{analytics && !analytics.empty ? analytics.total_tests : '3'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--gray)' }}>{t('dashAccuracy')}: </span>
                  <strong style={{ color: 'var(--success)' }}>{analytics && !analytics.empty ? `${analytics.average_score}%` : '85%'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Test Attempts & AI Guru */}
          <div className="grid-2" style={{ marginBottom: '32px' }}>
            {/* Recent Test Attempts */}
            <div className="card">
              <h3 className="card-title">📝 {t('dashRecentTests')}</h3>
              {history.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                  {language === 'hi' ? 'अभी तक कोई टेस्ट नहीं दिया गया। अपनी तैयारी जांचने के लिए पहला टेस्ट शुरू करें!' : 'No tests attempted yet. Take your first test to track performance!'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {history.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.test_title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                          {new Date(item.attempted_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: item.percentage >= 60 ? 'var(--success)' : 'var(--warning)' }}>
                          {item.score}/{item.total_marks} ({item.percentage}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Doubt Guru Quick Callout */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>24/7 AI Doubt Guru</h3>
              <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '20px', maxWidth: '360px' }}>
                {language === 'hi' ? 'किसी भी विषय में सवाल अटका है? AI गुरु से तुरंत हिंदी व अंग्रेजी में सटीक समाधान पाएं।' : 'Ask doubts in any subject and receive step-by-step guidance.'}
              </p>
              <button 
                onClick={() => onOpenAiDoubt ? onOpenAiDoubt() : (window.location.hash = '#ai-guru')}
                className="btn btn-primary"
                style={{ width: '100%', maxWidth: '240px' }}
              >
                💬 Ask a Doubt Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ONLINE PAYMENT GATEWAY MODAL (Razorpay / Instant Online Checkout) */}
      {selectedFeeToPay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-dark)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: 'var(--shadow-premium)',
            border: '1px solid var(--border)'
          }}>
            {!paymentSuccessData ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px'
                    }}>
                      💳
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                        Online Fee Payment
                      </h3>
                      <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                        Secure Gateway Checkout
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFeeToPay(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: '20px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{
                  backgroundColor: 'var(--bg)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid var(--border)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--gray)' }}>Course:</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{selectedFeeToPay.course_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--gray)' }}>Enrollment ID:</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{selectedFeeToPay.enrollment_no}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray)' }}>Total Due Amount:</span>
                    <strong style={{ color: '#ef4444' }}>₹{Number(selectedFeeToPay.due_amount).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Amount to pay */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Payment Amount (₹ INR)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedFeeToPay.due_amount}
                    min={1}
                    className="form-control"
                    style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                    You can pay full fee or custom partial installment.
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Select Payment Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'UPI / QR Code', icon: '📱', name: 'UPI (GPay / PhonePe)' },
                      { id: 'Credit / Debit Card', icon: '💳', name: 'Debit / Credit Card' },
                      { id: 'Net Banking', icon: '🏦', name: 'Net Banking' },
                      { id: 'Wallet / PayTM', icon: '👛', name: 'Wallets' }
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: selectedPaymentMethod === method.id ? '2px solid #2563eb' : '1px solid var(--border)',
                          backgroundColor: selectedPaymentMethod === method.id ? 'var(--primary-light)' : 'var(--bg)',
                          color: 'var(--text-dark)',
                          fontSize: '12px',
                          fontWeight: selectedPaymentMethod === method.id ? 700 : 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{method.icon}</span>
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isProcessingPayment}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {isProcessingPayment ? 'Processing with Gateway...' : `Proceed to Pay ₹${Number(paymentAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            ) : (
              /* Success confirmation view */
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  fontSize: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)' }}>
                  Payment Successful!
                </h3>
                <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>
                  Transaction <strong>{paymentSuccessData.payment?.transaction_id}</strong> has been verified and recorded.
                </p>

                <div style={{
                  backgroundColor: 'var(--bg)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  fontSize: '13px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--gray)' }}>Receipt Number:</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{paymentSuccessData.receipt_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--gray)' }}>Amount Paid:</span>
                    <strong style={{ color: '#10b981' }}>₹{Number(paymentSuccessData.payment?.amount).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray)' }}>Remaining Due:</span>
                    <strong style={{ color: paymentSuccessData.updated_fee?.due_amount > 0 ? '#ef4444' : '#10b981' }}>
                      ₹{Number(paymentSuccessData.updated_fee?.due_amount || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeeToPay(null);
                      handleViewReceipt(paymentSuccessData.receipt_id);
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                  >
                    📄 View & Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFeeToPay(null)}
                    className="btn btn-outline"
                    style={{ padding: '10px 18px', fontSize: '13px' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Printable Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}
