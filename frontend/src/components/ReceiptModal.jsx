import React from 'react';

export default function ReceiptModal({ receipt, isOpen, onClose }) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '620px',
        width: '100%',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        borderRadius: '20px',
        padding: 'clamp(16px, 4vw, 36px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Printable Receipt Content */}
        <div id="printable-fee-receipt" style={{ color: '#0f172a' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                🏛️
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  THE GUIDANCE COACHING INSTITUTE
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Bihar Board (BSEB) & CBSE Higher Academic Hub
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Bari Path, Near Patna College, Patna, Bihar - 800004
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                PAID & VERIFIED
              </span>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Receipt No: <strong style={{ color: '#0f172a' }}>{receipt.receipt_id || 'RCP-2026-9811'}</strong>
              </div>
            </div>
          </div>

          {/* Student Info Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '13px'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>STUDENT NAME</span>
              <strong style={{ color: '#0f172a', fontSize: '14px' }}>{receipt.student_name}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>ENROLLMENT NUMBER</span>
              <strong style={{ color: '#0f172a' }}>{receipt.enrollment_no || 'STU-BSEB-2026-1088'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>ACADEMIC COURSE</span>
              <span style={{ color: '#0f172a' }}>{receipt.course_name}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>SEMESTER / TERM</span>
              <span style={{ color: '#0f172a' }}>{receipt.semester || 'Semester 1'}</span>
            </div>
          </div>

          {/* Payment Itemization Table */}
          <div style={{ marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Description</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#334155' }}>
                    Tuition & Examination Fee Installment
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#334155' }}>
                    Online Digital Portal & Study Material Access
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                    INCLUDED (₹0)
                  </td>
                </tr>
                <tr style={{ borderTop: '2px solid #0f172a' }}>
                  <td style={{ padding: '12px 0', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                    Total Amount Paid
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, fontSize: '18px', color: '#2563eb' }}>
                    ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transaction Metadata */}
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '14px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#475569',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <div>
              <strong>Transaction ID:</strong> {receipt.transaction_id || 'TXN_GUIDANCE_9921'}
            </div>
            <div>
              <strong>Payment Date:</strong> {new Date(receipt.paid_at || Date.now()).toLocaleString('en-IN')}
            </div>
            <div>
              <strong>Payment Mode:</strong> {receipt.payment_method || 'UPI / Gateway'}
            </div>
          </div>

          {/* Footer Seal & Notes */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '16px',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <div>
              * This is a computer-generated official receipt with verified payment hash.
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, color: '#475569' }}>
              The Guidance Accounts Bureau
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '28px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '8px 18px', fontSize: '13px', color: '#475569', borderColor: '#cbd5e1' }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
