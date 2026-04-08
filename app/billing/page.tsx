"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRightCircle,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  Calculator,
  Wallet,
  CreditCard,
  Calendar,
  Clock,
  Percent,
  Printer,
  FileDown,
} from "lucide-react";
import { Bill, Inward } from "@/app/lib/db";
import { authFetch } from "@/app/lib/auth-fetch";
import { useToast } from "@/app/_components/ToastProvider";
import { useConfirm } from "@/app/_components/ConfirmProvider";
import { formatDate } from "@/app/lib/utils";

interface CompanySettings {
  companyName: string;
  companyShortName: string;
  companyTagline: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  sacCode: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  ifscCode: string;
  termsAndConditions: string[];
  jurisdiction: string;
  signatureLabel: string;
  signatureUrl: string;
  footerText: string;
}

// interface Inward removed, using imported one
export default function BillingPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedInwardIds, setSelectedInwardIds] = useState<Set<string>>(new Set());
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());

  // Bill Creation Screen State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billPreview, setBillPreview] = useState<any>(null);
  const [invoicePreviewData, setInvoicePreviewData] = useState<{
    bill: any;
    partyDetails: any;
  } | null>(null);

  // Inward Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInward, setEditingInward] = useState<Inward | null>(null);
  const [formData, setFormData] = useState<Partial<Inward>>({});
  const [parties, setParties] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"inwards" | "bills">("inwards");

  // Bill Data State
  const [bills, setBills] = useState<Bill[]>([]);
  const [billTotal, setBillTotal] = useState(0);
  const [billPage, setBillPage] = useState(1);
  const [billPageSize, setBillPageSize] = useState(10);
  const [billSearch, setBillSearch] = useState("");

  // Bill Edit State
  const [isEditBillModalOpen, setIsEditBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billFormData, setBillFormData] = useState<Partial<Bill>>({});

  interface LineItem {
    productId: string;
    description: string;
    quantity: number;
    weight: number;
    remainingQuantity: number;
    remaining?: number; // Fallback
    price: number;
    rate?: number; // Fallback
    amount: number;
    total?: number; // Fallback
    inDate?: string;
    date?: string; // Fallback
    inwardId?: string;
  }

  const products = ["KESAR RAS GREEN DORI", "ALPHONSO MANGO", "FROZEN PEAS"];

  // Company Settings State
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);

  const fetchCompanySettings = useCallback(async () => {
    try {
      const res = await authFetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setCompanySettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch company settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const fetchInwards = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/inwards?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setInwards(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch inwards:", error);
    }
  }, [page, pageSize, search]);

  const fetchParties = useCallback(async () => {
    try {
      const res = await authFetch(`/api/party?pageSize=100`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      if (data.data) {
        setParties(data.data.map((p: any) => p.name));
      }
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    }
  }, []);

  const fetchBills = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/billing?page=${billPage}&pageSize=${billPageSize}&search=${encodeURIComponent(billSearch)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setBills(data.data || []);
      setBillTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    }
  }, [billPage, billPageSize, billSearch]);

  useEffect(() => {
    setSelectedInwardIds(new Set());
    setSelectedBillIds(new Set());
    if (activeTab === "inwards") {
      fetchInwards();
    } else {
      fetchBills();
    }
  }, [activeTab, fetchInwards, fetchBills]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const handleSelectAllInwards = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInwardIds(new Set(inwards.map((i) => i.id)));
    } else {
      setSelectedInwardIds(new Set());
    }
  };

  const handleSelectInwardRow = (id: string) => {
    const newSelected = new Set(selectedInwardIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedInwardIds(newSelected);
  };

  const handleSelectAllBills = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBillIds(new Set(bills.map((b) => b.id)));
    } else {
      setSelectedBillIds(new Set());
    }
  };

  const handleSelectBillRow = (id: string) => {
    const newSelected = new Set(selectedBillIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedBillIds(newSelected);
  };

  const handleOpenModal = (inward?: Inward) => {
    if (inward) {
      setEditingInward(inward);
      setFormData(inward);
    } else {
      setEditingInward(null);
      setFormData({
        inwardDate: new Date().toISOString().split("T")[0],
        quantity: 0,
        unitWeight: 0,
        totalWeight: 0,
        remainingWeight: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingInward(null);
  };

  const handleSaveInward = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingInward
      ? `/api/inwards/${editingInward.id}`
      : "/api/inwards";
    const method = editingInward ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        closeModal();
        fetchInwards();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save inward: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to save inward:", error);
      showToast('error', 'Network error while saving inward.');
    }
  };

  const handleDeleteInward = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Inward',
      message: 'Are you sure you want to delete this recorded inward? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Now'
    });
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/inwards/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchInwards();
        setSelectedInwardIds(new Set());
      } else {
        const text = await res.text();
        showToast('error', `Failed to delete inward: ${text}`);
      }
    } catch (error) {
      console.error("Failed to delete inward:", error);
      showToast('error', 'Network error while deleting inward.');
    }
  };

  const handleBulkDeleteInwards = async () => {
    const count = selectedInwardIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Inwards',
      message: `Are you sure you want to delete ${count} selected records? This cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Items`
    });

    if (!confirmed) return;

    try {
      const res = await authFetch('/api/inwards/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedInwardIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} inwards deleted successfully`);
        setSelectedInwardIds(new Set());
        fetchInwards();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to bulk delete inwards');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Network error during bulk delete');
    }
  };

  const handleGenerateInwardBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/billing/generate-from-inwards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inwardIds: Array.from(selectedInwardIds),
          billPeriod: `${billPreview.month} ${billPreview.year}`,
          gstRate: billPreview.gst,
          outwardDate: billPreview.outwardDate,
          storageMonths: billPreview.storageMonths,
          storageDays: billPreview.storageDays,
          billingCycle: billPreview.billingCycle
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Failed to generate bill');
      }
      const data = await res.json();
      setIsBillModalOpen(false);
      setSelectedInwardIds(new Set());
      fetchInwards();
      fetchBills();

      // Refresh company settings so invoice preview has latest data
      await fetchCompanySettings();

      // Show Invoice Preview
      setInvoicePreviewData(data);
      showToast('success', 'Bill generated successfully!');
    } catch (error: any) {
      console.error("Failed to generate bill:", error);
      showToast('error', `Error generating bill: ${error.message}`);
    }
  };

  const handleOpenBillModal = async () => {
    if (selectedInwardIds.size === 0) return;
    try {
      const res = await authFetch("/api/billing/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inwardIds: Array.from(selectedInwardIds) }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Failed to generate preview');
      }
      const data = await res.json();
      setBillPreview(data);
      setIsBillModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate preview:", error);
      showToast('error', `Error generating preview: ${error.message}`);
    }
  };

  const handleSaveBill = async () => {
    try {
      const res = await authFetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...billPreview,
          storageMonths: billPreview.storageMonths,
          storageDays: billPreview.storageDays,
          billingCycle: billPreview.billingCycle
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsBillModalOpen(false);
        setSelectedInwardIds(new Set());
        fetchInwards();
        fetchBills();

        // Refresh company settings so invoice preview has latest data
        await fetchCompanySettings();

        // Show Invoice Preview
        setInvoicePreviewData(data);
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save bill: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to save bill:", error);
      showToast('error', "Failed to save bill. Please check your connection or server status.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const pages = document.querySelectorAll(".invoice-page");
      if (!pages.length) return;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (i > 0) pdf.addPage();

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Invoice_${invoicePreviewData?.bill?.billNumber}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
      showToast('error', "Could not download PDF. Please try printing to PDF instead.");
    }
  };

  const handleViewInvoice = async (bill: Bill) => {
    try {
      // Refresh company settings to ensure latest data
      await fetchCompanySettings();

      // Fetch party info
      const partyResponse = await authFetch(
        `/api/party?pageSize=1&search=${encodeURIComponent(bill.partyId)}`,
      );
      if (!partyResponse.ok) {
        throw new Error('Failed to fetch party details');
      }
      const partyData = await partyResponse.json();

      setInvoicePreviewData({
        bill,
        partyDetails: partyData?.data?.[0] || {},
      });
    } catch (error) {
      console.error("Failed to fetch party for invoice:", error);
      setInvoicePreviewData({
        bill,
        partyDetails: {},
      });
    }
  };

  const numberToWords = (num: number) => {
    if (num === 0) return "Zero Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function convertSection(n: number): string {
      if (n === 0) return "";
      if (n < 20) return ones[n];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + convertSection(n % 100) : "")
      );
    }

    const main = Math.floor(num);
    const fraction = Math.round((num - main) * 100);

    let result = "";
    let n = main;

    if (n >= 10000000) {
      result += convertSection(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      result += convertSection(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      result += convertSection(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      result += convertSection(n);
    }

    if (result.trim() === "") result = "Zero";
    result = result.trim() + " Rupees";

    if (fraction > 0) {
      result += " and " + convertSection(fraction) + " Paisa";
    }

    return result + " Only";
  };

  const handleEditBill = (bill: any) => {
    const normalizedCharges = Array.isArray(bill.additionalCharges)
      ? bill.additionalCharges
      : (Number(bill.additionalCharges) > 0
        ? [{ label: 'Manual Charges', chargeType: 'fixed', unit: '', value: 0, rate: 0, amount: Number(bill.additionalCharges) }]
        : []);

    setEditingBill(bill);
    setBillFormData({
      ...bill,
      additionalCharges: normalizedCharges
    });
    setIsEditBillModalOpen(true);
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    try {
      const res = await authFetch(`/api/billing/${editingBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...billFormData,
          storageMonths: billFormData.storageMonths,
          storageDays: billFormData.storageDays,
          billingCycle: billFormData.billingCycle
        }),
      });
      if (res.ok) {
        setIsEditBillModalOpen(false);
        fetchBills();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to update bill: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to update bill:", error);
      showToast('error', 'Network error while updating bill.');
    }
  };

  const deleteBill = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Bill',
      message: 'Are you sure you want to delete this bill? All related data will be permanently removed.',
      type: 'danger',
      confirmText: 'Delete Bill'
    });
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/billing/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBills();
        setSelectedBillIds(new Set());
      } else {
        const text = await res.text();
        let message = `Server returned ${res.status}`;
        try {
          const errorData = JSON.parse(text);
          message = errorData.error || errorData.message || message;
        } catch {
          message += `: ${text.slice(0, 100)}`;
        }
        showToast('error', `Failed to delete bill: ${message}`);
      }
    } catch (error) {
      console.error("Failed to delete bill:", error);
      showToast('error', 'Network error while deleting bill. Is the backend server running?');
    }
  };

  const handleBulkDeleteBills = async () => {
    const count = selectedBillIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Bills',
      message: `Are you sure you want to delete ${count} saved bills? All corresponding data will be removed.`,
      type: 'danger',
      confirmText: `Delete ${count} Bills`
    });

    if (!confirmed) return;

    try {
      const res = await authFetch('/api/billing/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedBillIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} bills deleted successfully`);
        setSelectedBillIds(new Set());
        fetchBills();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to bulk delete bills');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Network error during bulk delete');
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...billPreview.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    // Recalculate total for this item
    if (
      field === "quantity" ||
      field === "unitWeight" ||
      field === "weight" ||
      field === "months" ||
      field === "rate" ||
      field === "tax"
    ) {
      const qty =
        field === "quantity"
          ? Number(value)
          : newLineItems[index].quantity || 0;
      const unitWt =
        field === "unitWeight"
          ? Number(value)
          : newLineItems[index].unitWeight || 0;

      let weight = newLineItems[index].weight || 0;
      if (field === "quantity" || field === "unitWeight") {
        weight = Number((qty * unitWt).toFixed(2));
        newLineItems[index].weight = weight;
      }

      const rate = field === "rate" ? Number(value) : newLineItems[index].rate || 0;
      const months = field === "months" ? Number(value) : newLineItems[index].months || 1;
      const amt = Number((weight * rate * months).toFixed(2));
      newLineItems[index].total = amt;
      newLineItems[index].amount = amt;
    }

    // Recalculate grand totals
    let subTotal = 0;
    let taxTotal = 0;
    newLineItems.forEach((item: any) => {
      const weight = item.weight || 0;
      const rate = item.rate || 0;
      const months = item.months || 1;
      const amt = Number((weight * rate * months).toFixed(2));
      subTotal += amt;
      taxTotal += (amt * (item.tax || 0)) / 100;
    });

    // Sum additional charges
    const currentCharges = Array.isArray(billPreview.additionalCharges) ? billPreview.additionalCharges : [];
    const additionalTotal = currentCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

    setBillPreview({
      ...billPreview,
      lineItems: newLineItems,
      subTotal,
      taxTotal,
      grandTotal: subTotal + taxTotal + additionalTotal,
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 uppercase">
              {activeTab === "inwards" ? "Billing Queue" : "Invoice History"}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {activeTab === "inwards"
                ? "Process pending inwards to generate bills"
                : "View and manage generated invoices"}
            </p>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mt-4 sm:mt-0">
            <button
              onClick={() => setActiveTab("inwards")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === "inwards" ? "bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm" : "text-neutral-500"}`}
            >
              Pending Inwards
            </button>
            <button
              onClick={() => setActiveTab("bills")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === "bills" ? "bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm" : "text-neutral-500"}`}
            >
              Saved Bills
            </button>
          </div>
        </div>
        {/* Bordered Block with Controls */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col lg:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-neutral-300 w-full lg:w-auto">
            <label
              htmlFor="pageSize"
              className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px]"
            >
              Show
            </label>
            <div className="relative group">
              <select
                id="pageSize"
                value={activeTab === "inwards" ? pageSize : billPageSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  if (activeTab === "inwards") {
                    setPageSize(size);
                    setPage(1);
                  } else {
                    setBillPageSize(size);
                    setBillPage(1);
                  }
                }}
                className="appearance-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all hover:border-indigo-300"
              >
                {[10, 15, 20, 30].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <ChevronLeft className="w-4 h-4 -rotate-90" />
              </div>
            </div>
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px]">
              Entries
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search or select..."
                value={activeTab === "inwards" ? search : billSearch}
                onChange={(e) =>
                  activeTab === "inwards"
                    ? setSearch(e.target.value)
                    : setBillSearch(e.target.value)
                }
                className="block w-full pl-10 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            {activeTab === "inwards" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedInwardIds.size > 0 && (
                  <button
                    onClick={handleBulkDeleteInwards}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete ({selectedInwardIds.size})</span>
                  </button>
                )}
                <button
                  onClick={handleOpenBillModal}
                  disabled={selectedInwardIds.size === 0}
                  className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 sm:flex-initial active:scale-95 shadow-lg
                    ${selectedInwardIds.size > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600 shadow-none"
                    }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Generate Bill</span>
                </button>
              </div>
            )}

            {activeTab === "bills" && selectedBillIds.size > 0 && (
              <button
                onClick={handleBulkDeleteBills}
                className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 w-full sm:w-auto shadow-lg shadow-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bulk Delete ({selectedBillIds.size})</span>
              </button>
            )}
          </div>
        </div>
        {/* Table Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "inwards" ? (
              <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
                <thead className="bg-neutral-50/50 dark:bg-neutral-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 transition-all cursor-pointer"
                        checked={
                          inwards.length > 0 &&
                          selectedInwardIds.size === inwards.length
                        }
                        onChange={handleSelectAllInwards}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Inward Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Qty
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Unit Wt
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Total Weight
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Remaining
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Party
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Condition
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Outward
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {inwards.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
                            <Download className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                            No records found matching your selection
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    inwards.map((inward) => (
                      <tr
                        key={inward.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            value={inward.id}
                            checked={selectedInwardIds.has(inward.id)}
                            onChange={() => handleSelectInwardRow(inward.id)}
                            className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer shadow-sm transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {formatDate(inward.inwardDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                          {inward.quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                          {inward.unitWeight || 0} <span className="text-[10px] opacity-50 uppercase ml-0.5">kg</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {inward.totalWeight.toLocaleString()}{" "}
                          <span className="text-[10px] opacity-50 uppercase ml-1">
                            kg
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm
                            ${inward.remainingWeight > 0
                                ? inward.remainingWeight === inward.totalWeight
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                  : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                : "bg-neutral-50 text-neutral-500 border-neutral-100 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700"
                              }`}
                          >
                            {inward.remainingWeight.toLocaleString()} KG
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {inward.partyId}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-neutral-600 dark:text-neutral-400 italic">
                          {inward.productId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                            {inward.goodsCondition === "Good" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                            )}
                            {inward.goodsCondition || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() =>
                              router.push(`/outwards?inwardId=${inward.id}`)
                            }
                            className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-all hover:shadow-sm"
                          >
                            <span>Entry</span>
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="relative flex justify-end items-center group/menu">
                            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all peer">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-20 overflow-hidden">
                              <div className="py-1 text-left">
                                <button
                                  onClick={() => handleOpenModal(inward)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-3 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-indigo-500" />{" "}
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteInward(inward.id)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
                <thead className="bg-neutral-50/50 dark:bg-neutral-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 transition-all cursor-pointer"
                        checked={
                          bills.length > 0 &&
                          selectedBillIds.size === bills.length
                        }
                        onChange={handleSelectAllBills}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Bill No
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Out Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Party
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Total Amount (₹)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
                            <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                            No bills produced yet
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            value={bill.id}
                            checked={selectedBillIds.has(bill.id)}
                            onChange={() => handleSelectBillRow(bill.id)}
                            className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer shadow-sm transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {bill.billNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {formatDate(bill.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {formatDate(bill.outwardDate) || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {bill.partyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-neutral-900 dark:text-neutral-50">
                          ₹
                          {bill.grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm
                            ${bill.paymentStatus === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : bill.paymentStatus === "Pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                  : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                              }`}
                          >
                            {bill.paymentStatus || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="relative flex justify-end items-center group/menu">
                            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all peer">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-20 overflow-hidden text-left">
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewInvoice(bill)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 flex items-center gap-3 transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-indigo-500" />{" "}
                                  View Invoice
                                </button>
                                <button
                                  onClick={() => handleEditBill(bill)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-3 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-indigo-500" />{" "}
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteBill(bill.id)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />{" "}
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          <div className="bg-neutral-50/50 dark:bg-neutral-800/10 px-8 py-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {activeTab === "inwards" ? (
                <>
                  Showing{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {(page - 1) * pageSize + (inwards.length > 0 ? 1 : 0)}
                  </span>{" "}
                  —{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {Math.min(page * pageSize, total)}
                  </span>{" "}
                  of{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {total}
                  </span>
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {(billPage - 1) * billPageSize + (bills.length > 0 ? 1 : 0)}
                  </span>{" "}
                  —{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {Math.min(billPage * billPageSize, billTotal)}
                  </span>{" "}
                  of{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {billTotal}
                  </span>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  activeTab === "inwards"
                    ? setPage((p) => Math.max(1, p - 1))
                    : setBillPage((p) => Math.max(1, p - 1))
                }
                disabled={activeTab === "inwards" ? page === 1 : billPage === 1}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  activeTab === "inwards"
                    ? setPage((p) => Math.min(totalPages, p + 1))
                    : setBillPage((p) =>
                      Math.min(Math.ceil(billTotal / billPageSize), p + 1),
                    )
                }
                disabled={
                  activeTab === "inwards"
                    ? page === totalPages || totalPages === 0
                    : billPage === Math.ceil(billTotal / billPageSize) ||
                    billTotal === 0
                }
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>{" "}
          {/* Pagination (564) Close */}
        </div>{" "}
        {/* Table Area (370) Close */}
      </div>{" "}
      {/* max-w-7xl (276) Close */}
      {/* Inward Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {editingInward ? "Edit Inward" : "Add New Inward"}
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <span className="sr-only">Close</span>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSaveInward}
              className="flex flex-col flex-1 overflow-y-auto p-6 text-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Inward Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.inwardDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, inwardDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Party <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.partyId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, partyId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select Party
                    </option>
                    {parties.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.productId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, productId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select Product
                    </option>
                    {products.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Quantity (Units/Bags) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.quantity ?? ""}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const qty = rawVal === "" ? "" : Number(rawVal);
                      const unitWt = Number(formData.unitWeight) || 0;
                      const totalWt = (Number(qty) || 0) * unitWt;
                      setFormData({
                        ...formData,
                        quantity: qty as any,
                        totalWeight: totalWt,
                        remainingWeight: editingInward
                          ? formData.remainingWeight
                          : totalWt,
                      })
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Unit Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={formData.unitWeight ?? ""}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const unitWt = rawVal === "" ? "" : Number(rawVal);
                      const qty = Number(formData.quantity) || 0;
                      const totalWt = qty * (Number(unitWt) || 0);
                      setFormData({
                        ...formData,
                        unitWeight: unitWt as any,
                        totalWeight: totalWt,
                        remainingWeight: editingInward
                          ? formData.remainingWeight
                          : totalWt,
                      })
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 text-neutral-400">
                    Total Weight (kg) (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.totalWeight ?? ""}
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg cursor-not-allowed font-bold text-neutral-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Remaining Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.remainingWeight ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        remainingWeight: e.target.value === "" ? "" : Number(e.target.value) as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Goods Condition
                  </label>
                  <select
                    value={formData.goodsCondition || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goodsCondition: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Condition</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={formData.remarks || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm active:scale-95"
                >
                  {editingInward ? "Save Changes" : "Create Inward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bill Creation Screen / Modal */}
      {isBillModalOpen && billPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={() => setIsBillModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-5xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter flex items-center gap-3">
                  <Calculator className="w-7 h-7 text-indigo-600" />
                  Create New Bill
                </h3>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  Invoice Generation for {billPreview.partyId}
                </p>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Bill Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Bill Number
                  </label>
                  <input
                    type="text"
                    value={billPreview.billNumber}
                    onChange={(e) =>
                      setBillPreview({
                        ...billPreview,
                        billNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={billPreview.date}
                    onChange={(e) =>
                      setBillPreview({ ...billPreview, date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Party ID
                  </label>
                  <p className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {billPreview.partyId}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Outward Date
                  </label>
                  <input
                    type="date"
                    value={billPreview.outwardDate || ""}
                    onChange={(e) =>
                      setBillPreview({
                        ...billPreview,
                        outwardDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Billing Cycle
                  </label>
                  <select
                    value={billPreview.billingCycle || 'months'}
                    onChange={(e) => {
                      const newCycle = e.target.value as 'months' | 'days';
                      const val = newCycle === 'days' ? (billPreview.storageDays || 30) : (billPreview.storageMonths || 1);
                      const effMonths = newCycle === 'days' ? (val / 30) : val;

                      const newLineItems = billPreview.lineItems.map((item: any) => {
                        const amt = Number(((item.weight || 0) * (item.rate || 0) * effMonths).toFixed(2));
                        return { ...item, months: effMonths, total: amt, amount: amt };
                      });

                      let subTotal = 0;
                      let taxTotal = 0;
                      newLineItems.forEach((item: any) => {
                        subTotal += (item.total || 0);
                        taxTotal += ((item.total || 0) * (item.tax || 0)) / 100;
                      });

                      const currentCharges = Array.isArray(billPreview.additionalCharges) ? billPreview.additionalCharges : [];
                      const additionalTotal = currentCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

                      setBillPreview({
                        ...billPreview,
                        billingCycle: newCycle,
                        lineItems: newLineItems,
                        subTotal,
                        taxTotal,
                        grandTotal: subTotal + taxTotal + additionalTotal,
                      });
                    }}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="months">Months-wise</option>
                    <option value="days">Days-wise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    {billPreview.billingCycle === 'days' ? 'Storage Days' : 'Storage Months'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={(billPreview.billingCycle === 'days' ? billPreview.storageDays : billPreview.storageMonths) ?? ""}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const newVal = rawVal === "" ? "" : Number(rawVal);
                      const calcVal = Number(newVal) || 0;
                      const newCycle = billPreview.billingCycle || 'months';
                      const effMonths = newCycle === 'days' ? (calcVal / 30) : calcVal;

                      const newLineItems = billPreview.lineItems.map((item: any) => {
                        const amt = Number(((item.weight || 0) * (item.rate || 0) * effMonths).toFixed(2));
                        return { ...item, months: effMonths, total: amt, amount: amt };
                      });

                      let subTotal = 0;
                      let taxTotal = 0;
                      newLineItems.forEach((item: any) => {
                        subTotal += (item.total || 0);
                        taxTotal += ((item.total || 0) * (item.tax || 0)) / 100;
                      });

                      const currentCharges = Array.isArray(billPreview.additionalCharges) ? billPreview.additionalCharges : [];
                      const additionalTotal = currentCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

                      setBillPreview({
                        ...billPreview,
                        [newCycle === 'days' ? 'storageDays' : 'storageMonths']: newVal as any,
                        lineItems: newLineItems,
                        subTotal,
                        taxTotal,
                        grandTotal: subTotal + taxTotal + additionalTotal,
                      });
                    }}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                {/* Additional Charges Section */}
                <div className="col-span-full space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Additional Charges</h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-0.5">Extra services, loading or handling fees</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(billPreview.additionalCharges) ? billPreview.additionalCharges : [];
                        setBillPreview({
                          ...billPreview,
                          additionalCharges: [...current, { label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }]
                        });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Charge
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(billPreview.additionalCharges) && billPreview.additionalCharges.map((charge: any, idx: number) => (
                      <div key={idx} className="bg-neutral-50 dark:bg-neutral-950/50 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newCharges = billPreview.additionalCharges.filter((_: any, i: number) => i !== idx);
                            const sub = billPreview.subTotal || 0;
                            const tax = billPreview.taxTotal || 0;
                            const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                            setBillPreview({ ...billPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-900 text-rose-500 border border-neutral-100 dark:border-neutral-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Label</label>
                              <input
                                type="text"
                                placeholder="e.g. Loading"
                                value={charge.label}
                                onChange={(e) => {
                                  const newCharges = [...(billPreview.additionalCharges || [])];
                                  newCharges[idx].label = e.target.value;
                                  setBillPreview({ ...billPreview, additionalCharges: newCharges });
                                }}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Charge Type</label>
                              <select
                                value={charge.chargeType || 'quantity'}
                                onChange={(e) => {
                                  const newCharges = [...(billPreview.additionalCharges || [])];
                                  newCharges[idx].chargeType = e.target.value as 'fixed' | 'quantity' | 'weight';
                                  if (e.target.value === 'fixed') {
                                    newCharges[idx].value = 0;
                                    newCharges[idx].rate = 0;
                                  } else {
                                    newCharges[idx].amount = (newCharges[idx].value || 0) * (newCharges[idx].rate || 0);
                                  }
                                  const sub = billPreview.subTotal || 0;
                                  const tax = billPreview.taxTotal || 0;
                                  const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                  setBillPreview({ ...billPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
                                }}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="quantity">Quantity Wise</option>
                                <option value="weight">Weight Wise</option>
                                <option value="fixed">Fixed Amount</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 items-end">
                            {charge.chargeType !== 'fixed' ? (
                              <>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">{charge.chargeType === 'quantity' ? 'Quantity' : 'Weight (Kg)'}</label>
                                  <input
                                    type="number"
                                    value={charge.value ?? ''}
                                    onChange={(e) => {
                                      const newVal = e.target.value === "" ? "" : Number(e.target.value);
                                      const numVal = Number(newVal) || 0;
                                      const newCharges = [...(billPreview.additionalCharges || [])];
                                      newCharges[idx].value = newVal as any;
                                      newCharges[idx].amount = numVal * ((newCharges[idx].rate as any) || 0);
                                      const sub = billPreview.subTotal || 0;
                                      const tax = billPreview.taxTotal || 0;
                                      const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                      setBillPreview({ ...billPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
                                    }}
                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Rate (₹)</label>
                                  <input
                                    type="number"
                                    value={charge.rate ?? ''}
                                    onChange={(e) => {
                                      const newVal = e.target.value === "" ? "" : Number(e.target.value);
                                      const numVal = Number(newVal) || 0;
                                      const newCharges = [...(billPreview.additionalCharges || [])];
                                      newCharges[idx].rate = newVal as any;
                                      newCharges[idx].amount = numVal * ((newCharges[idx].value as any) || 0);
                                      const sub = billPreview.subTotal || 0;
                                      const tax = billPreview.taxTotal || 0;
                                      const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                      setBillPreview({ ...billPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
                                    }}
                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Amount (₹)</label>
                                <input
                                  type="number"
                                  value={charge.amount ?? ''}
                                  onChange={(e) => {
                                    const newVal = e.target.value === "" ? "" : Number(e.target.value);
                                    const newCharges = [...billPreview.additionalCharges];
                                    newCharges[idx].amount = newVal as any;
                                    const sub = billPreview.subTotal || 0;
                                    const tax = billPreview.taxTotal || 0;
                                    const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                    setBillPreview({ ...billPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
                                  }}
                                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                />
                              </div>
                            )}
                          </div>
                          {charge.chargeType !== 'fixed' && (
                            <div className="pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-tight text-neutral-400">Calculated Total</span>
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{(charge.amount || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!Array.isArray(billPreview.additionalCharges) || billPreview.additionalCharges.length === 0) && (
                    <div
                      onClick={() => {
                        const sub = billPreview.subTotal || 0;
                        const tax = billPreview.taxTotal || 0;
                        const newCharges = [{ label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }];
                        const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                        setBillPreview({
                          ...billPreview,
                          additionalCharges: newCharges,
                          grandTotal: sub + tax + additionalTotal
                        });
                      }}
                      className="group flex flex-col items-center justify-center py-10 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-4xl bg-white dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-neutral-400" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Add Additional Charges</p>
                      <p className="text-[9px] font-bold text-neutral-300 uppercase mt-1">Optional. E.g. Loading, Unloading, Handling</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="bg-neutral-50 dark:bg-neutral-950/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Description
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-24">
                        Qty
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-24">
                        Unit Wt
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-24">
                        Total Wt
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-20">
                        {billPreview.billingCycle === 'days' ? 'Days' : 'Months'}
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-28">
                        Rate (₹)
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-20">
                        Tax (%)
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right w-32">
                        Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {billPreview.lineItems.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        className="group hover:bg-white dark:hover:bg-neutral-900 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(idx, "description", e.target.value)
                            }
                            className="w-full bg-transparent font-medium border-0 focus:ring-0 p-0 outline-none text-neutral-900 dark:text-neutral-100"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.quantity ?? ""}
                            onChange={(e) =>
                              updateLineItem(idx, "quantity", e.target.value === "" ? "" : e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.unitWeight ?? ""}
                            onChange={(e) =>
                              updateLineItem(idx, "unitWeight", e.target.value === "" ? "" : e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            readOnly
                            value={item.weight || 0}
                            className="w-full bg-neutral-50 dark:bg-neutral-900 border-0 rounded-lg px-2 py-1.5 font-bold outline-none cursor-not-allowed text-neutral-400"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.months ?? ""}
                            onChange={(e) =>
                              updateLineItem(idx, "months", e.target.value === "" ? "" : e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.rate ?? ""}
                            onChange={(e) =>
                              updateLineItem(idx, "rate", e.target.value === "" ? "" : e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.tax ?? ""}
                            onChange={(e) =>
                              updateLineItem(idx, "tax", e.target.value === "" ? "" : e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary & Totals */}
              <div className="flex flex-col md:flex-row justify-between gap-12 pt-4">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Remarks / Terms
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Add payment terms or notes..."
                      value={billPreview.remarks}
                      onChange={(e) =>
                        setBillPreview({
                          ...billPreview,
                          remarks: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-4xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-3 bg-neutral-900 dark:bg-black rounded-4xl p-8 text-white shadow-xl transform hover:scale-[1.02] transition-transform">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Sub Total
                    </span>
                    <span className="font-bold font-mono">
                      ₹
                      {billPreview.subTotal?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Tax Amount
                    </span>
                    <span className="font-bold font-mono">
                      ₹
                      {billPreview.taxTotal?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-60 font-mono text-emerald-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Add. Charges
                    </span>
                    <span className="font-bold">
                      ₹
                      {(Array.isArray(billPreview.additionalCharges)
                        ? billPreview.additionalCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0)
                        : (billPreview.additionalCharges || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        Grand Total
                      </span>
                      <p className="text-4xl font-black tracking-tighter font-mono">
                        ₹
                        {billPreview.grandTotal?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-end gap-5">
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="px-8 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button
                onClick={handleSaveBill}
                className="px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all hover:shadow-indigo-500/30 shadow-lg active:scale-95 uppercase tracking-widest text-[10px] flex items-center gap-3"
              >
                <FileText className="w-4 h-4" />
                Save & Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Bill Modal */}
      {isEditBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={() => setIsEditBillModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter">
                  Edit Bill: {billFormData.billNumber}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
                  Update invoice details and status
                </p>
              </div>
              <button
                onClick={() => setIsEditBillModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateBill}
              className="flex-1 overflow-y-auto p-8 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Outward Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="date"
                      value={billFormData.outwardDate || ""}
                      onChange={(e) =>
                        setBillFormData({
                          ...billFormData,
                          outwardDate: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Storage Months
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      min={1}
                      value={billFormData.storageMonths ?? ""}
                      onChange={(e) =>
                        setBillFormData({
                          ...billFormData,
                          storageMonths: e.target.value === "" ? "" : Number(e.target.value) as any,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    GST (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={billFormData.gst ?? ""}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const newVal = rawVal === "" ? "" : Number(rawVal);
                        const calcGst = Number(newVal) || 0;
                        const subTotal = billFormData.subTotal || 0;
                        const sumCharges = (charges: any) => {
                          if (!charges) return 0;
                          if (Array.isArray(charges)) return charges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                          return Number(charges) || 0;
                        };
                        const additional = sumCharges(billFormData.additionalCharges);
                        const taxableAmount = subTotal + additional;
                        const taxTotal = (taxableAmount * calcGst) / 100;
                        setBillFormData({
                          ...billFormData,
                          gst: newVal as any,
                          taxTotal,
                          grandTotal: taxableAmount + taxTotal
                        });
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Additional Charges Section */}
                <div className="col-span-full space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Additional Charges</h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-0.5">Extra services, loading or handling fees</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const sub = billFormData.subTotal || 0;
                        const tax = billFormData.taxTotal || 0;
                        const current = Array.isArray(billFormData.additionalCharges) ? billFormData.additionalCharges : [];
                        const newCharge = { label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 };
                        const newCharges = [...current, newCharge];
                        const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                        setBillFormData({
                          ...billFormData,
                          additionalCharges: newCharges,
                          grandTotal: sub + tax + additionalTotal
                        });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Charge
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(billFormData.additionalCharges) && billFormData.additionalCharges.map((charge, idx) => (
                      <div key={idx} className="bg-neutral-50 dark:bg-neutral-950/50 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newCharges = (billFormData.additionalCharges as any[]).filter((_, i) => i !== idx);
                            const subTotal = billFormData.subTotal || 0;
                            const taxTotal = billFormData.taxTotal || 0;
                            const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                            setBillFormData({ ...billFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-900 text-rose-500 border border-neutral-100 dark:border-neutral-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Label</label>
                              <input
                                type="text"
                                placeholder="Label"
                                value={charge.label}
                                onChange={(e) => {
                                  const newCharges = [...(billFormData.additionalCharges || [])];
                                  newCharges[idx].label = e.target.value;
                                  setBillFormData({ ...billFormData, additionalCharges: newCharges });
                                }}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Type</label>
                              <select
                                value={charge.chargeType || 'quantity'}
                                onChange={(e) => {
                                  const newCharges = [...(billFormData.additionalCharges || [])];
                                  newCharges[idx].chargeType = e.target.value as 'fixed' | 'quantity' | 'weight';
                                  if (e.target.value === 'fixed') { newCharges[idx].value = 0; newCharges[idx].rate = 0; }
                                  setBillFormData({ ...billFormData, additionalCharges: newCharges });
                                }}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="quantity">Qty Wise</option>
                                <option value="weight">Wt Wise</option>
                                <option value="fixed">Fixed</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 items-end">
                            {charge.chargeType !== 'fixed' ? (
                              <>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">{charge.chargeType === 'quantity' ? 'Unit' : 'Kg'}</label>
                                  <input
                                    type="number"
                                    value={charge.value ?? ""}
                                    onChange={(e) => {
                                      const newVal = e.target.value === "" ? "" : Number(e.target.value);
                                      const numVal = Number(newVal) || 0;
                                      const newCharges = [...(billFormData.additionalCharges || [])];
                                      newCharges[idx].value = newVal as any;
                                      newCharges[idx].amount = numVal * ((newCharges[idx].rate as any) || 0);
                                      const subTotal = billFormData.subTotal || 0;
                                      const taxTotal = billFormData.taxTotal || 0;
                                      const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                      setBillFormData({ ...billFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
                                    }}
                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Rate</label>
                                  <input
                                    type="number"
                                    value={charge.rate ?? ""}
                                    onChange={(e) => {
                                      const newVal = e.target.value === "" ? "" : Number(e.target.value);
                                      const numVal = Number(newVal) || 0;
                                      const newCharges = [...(billFormData.additionalCharges || [])];
                                      newCharges[idx].rate = newVal as any;
                                      newCharges[idx].amount = numVal * ((newCharges[idx].value as any) || 0);
                                      const subTotal = billFormData.subTotal || 0;
                                      const taxTotal = billFormData.taxTotal || 0;
                                      const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                      setBillFormData({ ...billFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
                                    }}
                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Amount</label>
                                <input
                                  type="number"
                                  value={charge.amount ?? ""}
                                  onChange={(e) => {
                                    const newVal = e.target.value === "" ? "" : Number(e.target.value);
                                    const newCharges = [...(billFormData.additionalCharges || [])];
                                    newCharges[idx].amount = newVal as any;
                                    const subTotal = billFormData.subTotal || 0;
                                    const taxTotal = billFormData.taxTotal || 0;
                                    const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                    setBillFormData({ ...billFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
                                  }}
                                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                />
                              </div>
                            )}
                          </div>
                          {charge.chargeType !== 'fixed' && (
                            <div className="pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-tight text-neutral-400">Total</span>
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{(charge.amount || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!Array.isArray(billFormData.additionalCharges) || billFormData.additionalCharges.length === 0) && (
                      <div
                        onClick={() => {
                          const sub = billFormData.subTotal || 0;
                          const tax = billFormData.taxTotal || 0;
                          const newCharges = [{ label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }];
                          const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                          setBillFormData({
                            ...billFormData,
                            additionalCharges: newCharges,
                            grandTotal: sub + tax + additionalTotal
                          });
                        }}
                        className="col-span-full group flex flex-col items-center justify-center py-8 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-4xl bg-neutral-50 dark:bg-neutral-950/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5 text-neutral-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Add Extra Charges</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Payment Status
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={billFormData.paymentStatus || "Pending"}
                      onChange={(e) =>
                        setBillFormData({
                          ...billFormData,
                          paymentStatus: e.target.value as any,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Payment Mode
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={billFormData.paymentMode || "Cash"}
                      onChange={(e) =>
                        setBillFormData({
                          ...billFormData,
                          paymentMode: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  value={billFormData.remarks || ""}
                  onChange={(e) =>
                    setBillFormData({
                      ...billFormData,
                      remarks: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="mt-8 flex justify-end gap-5">
                <button
                  type="button"
                  onClick={() => setIsEditBillModalOpen(false)}
                  className="px-8 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Update Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Invoice Preview Modal */}
      {invoicePreviewData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm print:bg-white print:z-auto print:block print:relative print:p-0 p-4">
          <div className="flex flex-col max-h-[95vh] w-full max-w-5xl bg-slate-100 rounded-lg shadow-2xl relative print:h-auto print:max-h-none print:shadow-none print:bg-white">
            {/* Modal Header controls (Hidden on Print) */}
            <div className="flex justify-between items-center p-4 bg-white border-b print:hidden rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2 text-black">
                <FileText className="text-indigo-600" />
                Invoice Preview
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-lg transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <button
                  onClick={() => setInvoicePreviewData(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* A4 Printable Area */}
            <div className="flex-1 overflow-auto p-4 print:p-0 print:overflow-visible custom-scrollbar flex flex-col items-center gap-8 print:gap-0">
              {(() => {
                const ITEMS_PER_PAGE = 10;
                const items = invoicePreviewData.bill.lineItems;
                const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                const totalWt = items.reduce((sum: number, item: any) => sum + (Number(item.weight) || 0), 0);
                const chunks = [];
                for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
                  chunks.push(items.slice(i, i + ITEMS_PER_PAGE));
                }

                return chunks.map((pageItems, pageIdx) => (
                  <div
                    key={pageIdx}
                    id={pageIdx === 0 ? "invoice-content" : undefined}
                    className="invoice-page w-[210mm] min-h-[297mm] bg-white text-black p-[10mm] shadow-md border border-slate-200 print:shadow-none print:border-none print:w-full font-sans text-sm mx-auto flex flex-col print:break-after-page"
                  >
                    <div className="border border-black flex flex-col h-full relative flex-1">
                      {/* Header Row */}
                      <div className="flex border-b border-black">
                        <div className="w-1/3 p-4 flex flex-col items-center justify-center border-r border-black relative">
                          {companySettings?.logoUrl ? (
                            <img
                              src={
                                companySettings.logoUrl.startsWith("http")
                                  ? companySettings.logoUrl
                                  : `${window.location.origin}${companySettings.logoUrl}`
                              }
                              alt="Company Logo"
                              className="max-h-20 max-w-full object-contain"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <>
                              <h1 className="text-4xl font-black text-blue-900 tracking-tighter leading-none">
                                {companySettings?.companyShortName || "JCRM"}
                              </h1>
                              <p className="text-xl font-bold text-blue-900 mt-1 whitespace-nowrap uppercase">
                                {companySettings?.companyTagline ||
                                  "COLD STORAGE"}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="w-2/3 flex flex-col">
                          <div className="bg-slate-200 font-bold text-center text-lg py-1 border-b border-black uppercase tracking-widest">
                            {companySettings?.companyName ||
                              "JCRM COLD STORAGE LLP"}
                          </div>
                          <div className="text-center p-2 text-[11px] leading-relaxed font-semibold">
                            <p>{companySettings?.address || ""}</p>
                            <p>
                              Phone: {companySettings?.phone || ""} | Email:{" "}
                              {companySettings?.email || ""}
                            </p>
                            <p className="mt-1 font-bold">
                              GST: {companySettings?.gstNumber || ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Party & Bill Info Row */}
                      <div className="flex border-b border-black">
                        <div className="w-1/2 p-3 border-r border-black flex flex-col gap-1.5 text-xs font-bold font-mono">
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              M/S:
                            </span>{" "}
                            <span className="uppercase text-sm leading-tight ml-2">
                              {invoicePreviewData.bill.partyId}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              GST:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {invoicePreviewData.partyDetails?.gstNumber ||
                                "Unregistered"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              PAN:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {invoicePreviewData.partyDetails?.panNumber ||
                                "-"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              Ph:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {invoicePreviewData.partyDetails?.mobileNo || "-"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              Email:
                            </span>{" "}
                            <span className="ml-2 leading-tight truncate">
                              {invoicePreviewData.partyDetails?.email || "-"}
                            </span>
                          </div>
                          {invoicePreviewData.partyDetails?.address && (
                            <div className="flex mt-1 text-[10px] text-slate-600 leading-tight">
                              <span className="w-16 flex-shrink-0">ADD:</span>
                              <span className="uppercase ml-2">
                                {invoicePreviewData.partyDetails.address},{" "}
                                {invoicePreviewData.partyDetails.city}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-1/2 p-3 flex flex-col gap-1.5 text-xs font-bold relative font-mono">
                          <div className="absolute top-2 right-0 left-0 text-center font-black text-sm tracking-widest uppercase">
                            TAX INVOICE
                          </div>
                          <div className="mt-6 flex flex-col gap-2 relative z-10">
                            <div>CASH/CREDIT Memo</div>
                            <div>
                              SAC: {companySettings?.sacCode || "996721"}
                            </div>
                            <div>
                              Bill No: {invoicePreviewData.bill.billNumber}
                            </div>
                            <div>
                              Date: {formatDate(new Date().toISOString())}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Page {pageIdx + 1} of {chunks.length}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Header */}
                      <div className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] bg-neutral-50/50 border-y-2 border-slate-900 text-[10px] font-black uppercase text-center items-stretch h-10">
                        <div className="px-2 flex items-center border-r border-slate-900 text-left">
                          Product
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          In Date
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Out Date
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Qty
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Unit.Wt
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Tot.Wt
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Price
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          {invoicePreviewData.bill.billingCycle === 'days' ? 'Days' : 'Mon.'}
                        </div>
                        <div className="px-2 flex items-center justify-center">
                          Amount
                        </div>
                      </div>

                      {/* Items Rows */}
                      <div className="flex-1 border-b border-black font-semibold text-[10px] flex flex-col">
                        {pageItems.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] text-center border-b border-black/20 items-stretch min-h-8"
                          >
                            <div
                              className="px-2 py-1.5 text-left uppercase break-all border-r border-black/20 flex items-center"
                              title={item.description}
                            >
                              {item.description}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {formatDate(item.inDate || item.date)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {formatDate(item.outDate ||
                                invoicePreviewData.bill.outwardDate)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.quantity || 0}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.unitWeight || 0}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.weight || 0}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {Number(item.price || item.rate || 0).toFixed(2)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {invoicePreviewData.bill.billingCycle === 'days'
                                ? (invoicePreviewData.bill.storageDays || 30)
                                : (invoicePreviewData.bill.storageMonths || item.months || 1)}
                            </div>
                            <div className="px-2 py-1.5 text-[10px] font-bold flex items-center justify-end">
                              {Number(item.amount || item.total || 0).toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Empty fill to stretch */}
                        <div className="flex-1 grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] items-stretch">
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div></div>
                        </div>

                        {/* Totals Row - ONLY ON LAST PAGE */}
                        {pageIdx === chunks.length - 1 && (
                          <div className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] border-t-2 border-black font-black bg-neutral-50/50 items-center min-h-8 text-center">
                            <div className="col-span-3 px-2 text-right border-r border-black/20 uppercase tracking-tighter pr-4">Total:</div>
                            <div className="px-1 border-r border-black/20 flex items-center justify-center h-full">{totalQty}</div>
                            <div className="px-1 border-r border-black/20"></div>
                            <div className="px-1 border-r border-black/20 flex items-center justify-center h-full">{totalWt.toFixed(2)}</div>
                            <div className="col-span-3"></div>
                          </div>
                        )}
                      </div>

                      {/* Totals & Remarks Row - ONLY ON LAST PAGE */}
                      {pageIdx === chunks.length - 1 ? (
                        <>
                          <div className="flex border-b border-black min-h-36 flex-wrap">
                            <div className="w-1/2 p-4 font-semibold text-xs border-r border-black flex flex-col gap-1.5 font-mono leading-tight bg-slate-50/30">
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Remarks :
                                </span>{" "}
                                <span className="text-black uppercase">
                                  {invoicePreviewData.bill.remarks ||
                                    "COLD RENT"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Bank Detail:
                                </span>{" "}
                                <span className="text-black uppercase">
                                  {companySettings?.bankName || "Canara Bank"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Branch:
                                </span>{" "}
                                <span className="text-black uppercase">
                                  {companySettings?.bankBranch || "Hazira"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  A/C Number:
                                </span>{" "}
                                <span className="text-black font-black">
                                  {companySettings?.accountNumber ||
                                    "120029409483"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  IFSC Code:
                                </span>{" "}
                                <span className="text-black font-black uppercase">
                                  {companySettings?.ifscCode || "CNRB0003428"}
                                </span>
                              </div>
                            </div>
                            <div className="w-1/2 flex flex-col font-bold text-xs p-4 font-mono bg-white">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                    Sub Total:
                                  </span>{" "}
                                  <span className="text-base text-black">
                                    ₹
                                    {Number(
                                      invoicePreviewData.bill.subTotal || 0,
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                {(() => {
                                  const charges = invoicePreviewData.bill.additionalCharges;
                                  if (!charges) return null;
                                  let total = 0;
                                  if (Array.isArray(charges)) {
                                    total = charges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                    if (total <= 0) return null;
                                    return (
                                      <div className="space-y-1">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100 pb-1 mb-1">Detailed Charges:</div>
                                        {charges.map((c: any, i: number) => (
                                          <div key={i} className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500 italic">{c.label || 'Extra Charge'}:</span>
                                            <span className="text-black font-semibold">₹{Number(c.amount || 0).toFixed(2)}</span>
                                          </div>
                                        ))}
                                        <div className="flex justify-between items-center border-t border-slate-100 mt-1 pt-1 font-black text-emerald-600">
                                          <span className="uppercase tracking-tighter">Total Add. Charges:</span>
                                          <span className="text-black">₹{total.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    );
                                  } else if (Number(charges) > 0) {
                                    total = Number(charges);
                                    return (
                                      <div className="flex justify-between items-center text-emerald-600">
                                        <span className="font-bold uppercase tracking-tighter">Add. Charges:</span>
                                        <span className="text-black">₹{total.toFixed(2)}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {(invoicePreviewData.bill.taxTotal || 0) >
                                  0 && (
                                    <>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                          SGST @ {Number((invoicePreviewData.bill.taxTotal > 0 ? (invoicePreviewData.bill.taxTotal * 100 / (invoicePreviewData.bill.subTotal || 1)) : (invoicePreviewData.bill.gst ?? invoicePreviewData.bill.gstRate ?? 18)) / 2).toFixed(1)}%:
                                        </span>{" "}
                                        <span className="text-black">
                                          ₹
                                          {Number(
                                            (invoicePreviewData.bill.taxTotal ||
                                              0) / 2,
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                          CGST @ {Number((invoicePreviewData.bill.taxTotal > 0 ? (invoicePreviewData.bill.taxTotal * 100 / (invoicePreviewData.bill.subTotal || 1)) : (invoicePreviewData.bill.gst ?? invoicePreviewData.bill.gstRate ?? 18)) / 2).toFixed(1)}%:
                                        </span>{" "}
                                        <span className="text-black">
                                          ₹
                                          {Number(
                                            (invoicePreviewData.bill.taxTotal ||
                                              0) / 2,
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                              </div>
                              <div className="flex justify-between items-center border-t border-black pt-2 mt-2 text-lg font-black bg-slate-900 text-white p-2 rounded-lg">
                                <span className="uppercase tracking-tighter text-xs text-indigo-300">
                                  Net Amount:
                                </span>
                                <span>
                                  ₹
                                  {Number(
                                    invoicePreviewData.bill.grandTotal || 0,
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Words Row */}
                          <div className="border-b border-black p-3 font-bold text-[11px] uppercase font-mono bg-slate-100 flex items-center gap-3">
                            <span className="text-slate-500 font-black italic">
                              Amount in words:
                            </span>
                            <span className="text-black">
                              {numberToWords(
                                Number(invoicePreviewData.bill.grandTotal || 0),
                              )}
                            </span>
                          </div>

                          {/* Signature Section */}
                          <div className="flex border-b border-black">
                            <div className="w-1/2 p-3 text-[10px] border-r border-black flex flex-col justify-end bg-slate-50/20 italic text-slate-500">
                              Note: This is a computer generated document and does not require a physical signature.
                            </div>
                            <div className="w-1/2 flex flex-col justify-end items-center p-6 text-[11px] bg-slate-50/50 relative min-h-32">
                              {/* Signature Image Container */}
                              <div className="absolute top-2 bottom-12 left-4 right-4 flex items-center justify-center pointer-events-none">
                                {companySettings?.signatureUrl && (
                                  <img
                                    src={companySettings.signatureUrl}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    crossOrigin="anonymous"
                                  />
                                )}
                              </div>

                              {/* Signature Text Section */}
                              <div className="w-full border-t-2 border-slate-900 text-center font-black pt-2 uppercase tracking-tighter relative z-10 bg-slate-50/80">
                                {companySettings?.signatureLabel ||
                                  "Authorized Signatory"}
                                <div className="text-[9px] font-bold text-slate-500 mt-1 capitalize">
                                  For{" "}
                                  {companySettings?.companyName ||
                                    "JCRM Cold Storage LLP"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center border-b border-black bg-slate-50/30">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Continued on next page...</p>
                        </div>
                      )}

                      {/* Footer small text */}
                      <div className="absolute -bottom-6 w-full text-center text-[9px] font-bold text-slate-400 print:bottom-[-25px] uppercase tracking-widest">
                        SUBJECT TO {companySettings?.jurisdiction || "SURAT"}{" "}
                        JURISDICTION —{" "}
                        {companySettings?.footerText ||
                          "THIS IS A COMPUTER GENERATED DOCUMENT"} — GENERATED ON: {formatDate(new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                ));
              })()}

              {/* Page 2: Terms & Conditions */}
              {/* <div 
                className="w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] shadow-md border border-slate-200 print:shadow-none print:border-none print:w-full font-sans text-sm mx-auto mt-8 print:mt-0 print:break-before-page"
              >
                <div className="border border-black h-full flex flex-col p-10 bg-slate-50/10 relative">
                  <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">Terms & Conditions</h2>
                    <div className="text-right">
                       <p className="text-xs font-bold text-slate-500 uppercase">Document Reference</p>
                       <p className="text-sm font-black italic">#{invoicePreviewData.bill.billNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-6 text-sm leading-relaxed text-slate-800 flex-1">
                    {companySettings?.termsAndConditions && companySettings.termsAndConditions.length > 0 ? (
                      companySettings.termsAndConditions.map((term, idx) => (
                        <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                          <p className="flex-1 font-medium">{term}</p>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-4">
                        {[
                          "Any complaint about this tax invoice must be lodged within two working days of receipt.",
                          "All payments must be made in favour of JCRM Cold Storage LLP via Bank Transfer/Cheque/Draft.",
                          "Overdue accounts will be charged interest at a rate of 24% per annum after 7 days of the invoice date.",
                          "All goods are stored under the owner's risk; the company is not responsible for any natural depletion in weight or quality.",
                          "The warehouse reserves the right to lien on the goods for unpaid storage charges and other dues.",
                          "Disputes, if any, shall be subject to Surat Jurisdiction exclusively."
                        ].map((text, idx) => (
                          <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                            <p className="flex-1 font-medium">{text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-20 flex justify-between items-end border-t border-slate-200 pt-8">
                     <div className="text-[10px] font-bold text-slate-400 italic">
                       Continued from Page 1 — Bill No: {invoicePreviewData.bill.billNumber}
                     </div>
                     <div className="text-center w-48">
                       <div className="border-t border-black pt-2 text-[10px] font-black uppercase">
                          Receiver's Signature
                       </div>
                     </div>
                  </div>

                  <div className="absolute bottom-6 w-full text-center left-0 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    PAGE 2 of 2
                  </div>
                </div>
              </div> */}
            </div>

            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print\\:bg-white {
                  background-color: white !important;
                }
                .print\\:block {
                  display: block !important;
                }
                .print\\:shadow-none {
                  box-shadow: none !important;
                }
                .print\\:border-none {
                  border: none !important;
                }
                .print\\:w-full {
                  width: 100% !important;
                  max-width: 100% !important;
                }
                .print\\:p-0 {
                  padding: 0 !important;
                }
                .print\\:h-auto {
                  height: auto !important;
                }
                .print\\:max-h-none {
                  max-height: none !important;
                }
                .print\\:break-after-page {
                  break-after: page;
                  page-break-after: always;
                }
                .invoice-page,
                .invoice-page * {
                  visibility: visible;
                }
                .invoice-page {
                  position: relative !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  padding: 10mm !important;
                  margin: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}