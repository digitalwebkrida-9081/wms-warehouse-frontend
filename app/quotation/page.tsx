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
import { Quotation } from "@/app/lib/db";
import { authFetch } from "@/app/lib/auth-fetch";
import { useToast } from "@/app/_components/ToastProvider";
import { useConfirm } from "@/app/_components/ConfirmProvider";
import { useLoading } from "@/app/_components/LoadingProvider";
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

interface Inward {
  id: string;
  inwardDate: string;
  partyId: string;
  productId: string;
  totalWeight: number;
  remainingWeight: number;
  goodsCondition: string;
  remarks: string;
  inwardNumber?: string;
}
export default function QuotationPage() {
  const { showToast } = useToast();
  const { setIsLoading } = useLoading();
  const confirm = useConfirm();
  const router = useRouter();
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedInwardIds, setSelectedInwardIds] = useState<Set<string>>(new Set());
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<Set<string>>(new Set());
  const [isManualMode, setIsManualMode] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // Quotation Management State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationPreview, setQuotationPreview] = useState<any>(null);
  const [quotationPreviewData, setQuotationPreviewData] = useState<{
    quotation: any;
    partyDetails: any;
  } | null>(null);

  // Inward Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInward, setEditingInward] = useState<Inward | null>(null);
  const [formData, setFormData] = useState<Partial<Inward>>({});
  const [parties, setParties] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"inwards" | "quotations">("inwards");

  // Quotation Data State
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationTotal, setQuotationTotal] = useState(0);
  const [quotationPage, setQuotationPage] = useState(1);
  const [quotationPageSize, setQuotationPageSize] = useState(10);
  const [quotationSearch, setQuotationSearch] = useState("");

  // Quotation Edit State
  const [isEditQuotationModalOpen, setIsEditQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [quotationFormData, setQuotationFormData] = useState<Partial<Quotation>>({});

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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, setIsLoading]);

  const fetchParties = useCallback(async () => {
    try {
      const res = await authFetch(`/api/party?pageSize=100`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      if (data.data) {
        const uniqueNames = Array.from(new Set(data.data.map((p: any) => p.name)));
        setParties(uniqueNames as string[]);
      }
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(
        `/api/quotation?page=${quotationPage}&pageSize=${quotationPageSize}&search=${encodeURIComponent(quotationSearch)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setQuotations(data.data || []);
      setQuotationTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [quotationPage, quotationPageSize, quotationSearch, setIsLoading]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authFetch("/api/product?pageSize=1000");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  useEffect(() => {
    fetchInwards();
    fetchQuotations();
    fetchProducts();
  }, [fetchInwards, fetchQuotations, fetchProducts]);

  useEffect(() => {
    setSelectedInwardIds(new Set());
    setSelectedQuotationIds(new Set());
    if (activeTab === "inwards") {
      fetchInwards();
    } else {
      fetchQuotations();
    }
  }, [activeTab, fetchInwards, fetchQuotations]);

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

  const handleSelectAllQuotations = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuotationIds(new Set(quotations.map((q) => q.id)));
    } else {
      setSelectedQuotationIds(new Set());
    }
  };

  const handleSelectQuotationRow = (id: string) => {
    const newSelected = new Set(selectedQuotationIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedQuotationIds(newSelected);
  };

  const handleOpenModal = (inward?: Inward) => {
    if (inward) {
      setEditingInward(inward);
      setFormData(inward);
    } else {
      setEditingInward(null);
      setFormData({
        inwardDate: new Date().toISOString().split("T")[0],
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

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInward = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Inward',
      message: 'Are you sure you want to delete this inward? It may be linked to other records.',
      type: 'danger',
      confirmText: 'Delete Now'
    });
    if (!confirmed) return;
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenQuotationModal = async () => {
    if (selectedInwardIds.size === 0) return;
    setIsManualMode(false);
    setIsLoading(true);
    try {
      const res = await authFetch("/api/quotation/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inwardIds: Array.from(selectedInwardIds) }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Failed to generate preview');
      }
      const data = await res.json();
      setQuotationPreview(data);
      setIsQuotationModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate preview:", error);
      showToast('error', `Error generating preview: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManualQuotation = async () => {
    setIsManualMode(true);
    setIsLoading(true);
    try {
      const res = await authFetch("/api/quotation/next-number");
      if (!res.ok) throw new Error("Failed to fetch quotation number");
      const { nextNumber } = await res.json();

      setQuotationPreview({
        quotationNumber: nextNumber,
        date: new Date().toISOString().split("T")[0],
        partyId: "",
        lineItems: [],
        subTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        outwardDate: new Date().toISOString().split("T")[0],
        storageMonths: 1,
        storageDays: 30,
        billingCycle: 'months',
      });
      setIsQuotationModalOpen(true);
    } catch (error) {
      console.error("Failed to start manual quotation:", error);
      showToast('error', "Failed to start manual quotation.");
    } finally {
      setIsLoading(false);
    }
  };

  const addLineItem = () => {
    const newLineItems = [
      ...quotationPreview.lineItems,
      {
        description: "",
        quantity: 0,
        weight: 0,
        rate: 0,
        months: 1,
        tax: 0,
        total: 0,
      },
    ];
    setQuotationPreview({ ...quotationPreview, lineItems: newLineItems });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = quotationPreview.lineItems.filter((_: any, i: number) => i !== index);
    setQuotationPreview({ ...quotationPreview, lineItems: newLineItems });
  };

  const handleSaveQuotation = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quotationPreview,
          storageMonths: quotationPreview.storageMonths,
          storageDays: quotationPreview.storageDays,
          billingCycle: quotationPreview.billingCycle
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsQuotationModalOpen(false);
        setSelectedInwardIds(new Set());
        fetchInwards();
        fetchQuotations();

        // Refresh company settings so preview has latest data
        await fetchCompanySettings();

        // Show Quotation Preview
        setQuotationPreviewData(data);
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save quotation: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to save quotation:", error);
      showToast('error', "Failed to save quotation. Please check your connection or server status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsLoading(true);
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

      pdf.save(`Quotation_${quotationPreviewData?.quotation?.quotationNumber}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
      showToast('error', "Could not download PDF. Please try printing to PDF instead.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuotation = async (quotation: Quotation) => {
    setIsLoading(true);
    try {
      // Refresh company settings to ensure latest data
      await fetchCompanySettings();

      // Fetch party info
      const partyResponse = await authFetch(
        `/api/party?pageSize=1&search=${encodeURIComponent(quotation.partyId)}`,
      );
      if (!partyResponse.ok) {
        throw new Error('Failed to fetch party details');
      }
      const partyData = await partyResponse.json();

      setQuotationPreviewData({
        quotation,
        partyDetails: partyData?.data?.[0] || {},
      });
    } catch (error) {
      console.error("Failed to fetch party for quotation:", error);
      setQuotationPreviewData({
        quotation,
        partyDetails: {},
      });
    } finally {
      setIsLoading(false);
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

  const handleEditQuotation = (quotation: any) => {
    const normalizedCharges = Array.isArray(quotation.additionalCharges) 
      ? quotation.additionalCharges 
      : (Number(quotation.additionalCharges) > 0 
          ? [{ label: 'Manual Charges', chargeType: 'fixed', unit: '', value: 0, rate: 0, amount: Number(quotation.additionalCharges) }] 
          : []);
          
    setEditingQuotation(quotation);
    setQuotationFormData({
      ...quotation,
      additionalCharges: normalizedCharges
    });
    setIsEditQuotationModalOpen(true);
  };

  const handleUpdateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/quotation/${editingQuotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quotationFormData,
          storageMonths: quotationFormData.storageMonths,
          storageDays: quotationFormData.storageDays,
          billingCycle: quotationFormData.billingCycle
        }),
      });
      if (res.ok) {
        setIsEditQuotationModalOpen(false);
        fetchQuotations();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to update quotation: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to update quotation:", error);
      showToast('error', 'Network error while updating quotation.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuotation = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Quotation',
      message: 'Are you sure you want to delete this quotation? This action is permanent.',
      type: 'danger',
      confirmText: 'Delete Quotation'
    });
    if (!confirmed) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/quotation/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuotations();
        setSelectedQuotationIds(new Set());
      } else {
        const text = await res.text();
        showToast('error', `Failed to delete quotation: ${text}`);
      }
    } catch (error) {
      console.error("Failed to delete quotation:", error);
      showToast('error', 'Network error while deleting quotation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDeleteQuotations = async () => {
    const count = selectedQuotationIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Quotations',
      message: `Are you sure you want to delete ${count} selected quotations? This action cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Quotations`
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await authFetch('/api/quotation/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedQuotationIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} quotations deleted successfully`);
        setSelectedQuotationIds(new Set());
        fetchQuotations();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to bulk delete');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Network error during bulk delete');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...quotationPreview.lineItems];
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
      } else if (field === "weight") {
        weight = Number(value);
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
    const currentCharges = Array.isArray(quotationPreview.additionalCharges) ? quotationPreview.additionalCharges : [];
    const additionalTotal = currentCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

    setQuotationPreview({
      ...quotationPreview,
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
              {activeTab === "inwards" ? "Quotation Queue" : "Estimate History"}
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
              onClick={() => setActiveTab("quotations")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === "quotations" ? "bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm" : "text-neutral-500"}`}
            >
              Saved Quotations
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
                value={activeTab === "inwards" ? pageSize : quotationPageSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  if (activeTab === "inwards") {
                    setPageSize(size);
                    setPage(1);
                  } else {
                    setQuotationPageSize(size);
                    setQuotationPage(1);
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
                value={activeTab === "inwards" ? search : quotationSearch}
                onChange={(e) =>
                  activeTab === "inwards"
                    ? setSearch(e.target.value)
                    : setQuotationSearch(e.target.value)
                }
                className="block w-full pl-10 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            <button
              onClick={handleCreateManualQuotation}
              className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/10 w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quotation</span>
            </button>

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
                  onClick={handleOpenQuotationModal}
                  disabled={selectedInwardIds.size === 0}
                  className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 sm:flex-initial active:scale-95 shadow-lg
                    ${selectedInwardIds.size > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600 shadow-none"
                    }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Generate Quotation</span>
                </button>
              </div>
            )}

            {activeTab === "quotations" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedQuotationIds.size > 0 && (
                  <button
                    onClick={handleBulkDeleteQuotations}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 w-full sm:w-auto shadow-lg shadow-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Bulk Delete ({selectedQuotationIds.size})</span>
                  </button>
                )}
              </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400 italic">
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
                    <th scope="col" className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 transition-all cursor-pointer"
                        checked={
                          quotations.length > 0 &&
                          selectedQuotationIds.size === quotations.length
                        }
                        onChange={handleSelectAllQuotations}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Quotation No
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
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
                            <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                            No quotation records
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    quotations.map((quotation) => (
                      <tr
                        key={quotation.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            value={quotation.id}
                            checked={selectedQuotationIds.has(quotation.id)}
                            onChange={() =>
                              handleSelectQuotationRow(quotation.id)
                            }
                            className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer shadow-sm transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {quotation.quotationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {formatDate(quotation.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {quotation.partyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-neutral-900 dark:text-neutral-50">
                          ₹
                          {quotation.grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm
                            ${quotation.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : quotation.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                  : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                              }`}
                          >
                            {quotation.status || "Pending"}
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
                                  onClick={() => handleViewQuotation(quotation)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 flex items-center gap-3 transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-indigo-500" />{" "}
                                  View Quotation
                                </button>
                                <button
                                  onClick={() => handleEditQuotation(quotation)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-3 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-indigo-500" />{" "}
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteQuotation(quotation.id)}
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
                    {(quotationPage - 1) * quotationPageSize + (quotations.length > 0 ? 1 : 0)}
                  </span>{" "}
                  —{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {Math.min(quotationPage * quotationPageSize, quotationTotal)}
                  </span>{" "}
                  of{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {quotationTotal}
                  </span>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  activeTab === "inwards"
                    ? setPage((p) => Math.max(1, p - 1))
                    : setQuotationPage((p) => Math.max(1, p - 1))
                }
                disabled={activeTab === "inwards" ? page === 1 : quotationPage === 1}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  activeTab === "inwards"
                    ? setPage((p) => Math.min(totalPages, p + 1))
                    : setQuotationPage((p) =>
                      Math.min(Math.ceil(quotationTotal / quotationPageSize), p + 1),
                    )
                }
                disabled={
                  activeTab === "inwards"
                    ? page === totalPages || totalPages === 0
                    : quotationPage === Math.ceil(quotationTotal / quotationPageSize) ||
                    quotationTotal === 0
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
                    {products.map((p: any) => (
                      <option key={p.id || p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Total Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.totalWeight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalWeight: Number(e.target.value),
                        remainingWeight: editingInward
                          ? formData.remainingWeight
                          : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Remaining Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={
                      formData.remainingWeight !== undefined
                        ? formData.remainingWeight
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        remainingWeight: Number(e.target.value),
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
      {/* Quotation Creation Screen / Modal */}
      {isQuotationModalOpen && quotationPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={() => setIsQuotationModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-5xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter flex items-center gap-3">
                  <Calculator className="w-7 h-7 text-indigo-600" />
                  Create New Quotation
                </h3>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  Quotation Generation for {quotationPreview.partyId}
                </p>
              </div>
              <button
                onClick={() => setIsQuotationModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quotation Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Quotation Number
                  </label>
                  <input
                    type="text"
                    value={quotationPreview.quotationNumber}
                    onChange={(e) =>
                      setQuotationPreview({
                        ...quotationPreview,
                        quotationNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Quotation Date
                  </label>
                  <input
                    type="date"
                    value={quotationPreview.date}
                    onChange={(e) =>
                      setQuotationPreview({ ...quotationPreview, date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Outward Date (Manual)
                  </label>
                  <input
                    type="date"
                    value={quotationPreview.outwardDate || ""}
                    onChange={(e) =>
                      setQuotationPreview({ ...quotationPreview, outwardDate: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-indigo-600 dark:text-indigo-400 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Party {isManualMode && <span className="text-red-500">*</span>}
                  </label>
                  {isManualMode ? (
                    <select
                      value={quotationPreview.partyId || ""}
                      onChange={(e) =>
                        setQuotationPreview({
                          ...quotationPreview,
                          partyId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select Party</option>
                      {parties.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {quotationPreview.partyId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Billing Cycle
                  </label>
                  <select
                    value={quotationPreview.billingCycle || 'months'}
                    onChange={(e) => {
                      const newCycle = e.target.value as 'months' | 'days';
                      const val = newCycle === 'days' ? (quotationPreview.storageDays || 30) : (quotationPreview.storageMonths || 1);
                      const effMonths = newCycle === 'days' ? (val / 30) : val;
                      
                      const newLineItems = quotationPreview.lineItems.map((item: any) => {
                        const amt = Number(((item.weight || 0) * (item.rate || 0) * effMonths).toFixed(2));
                        return { ...item, months: effMonths, total: amt, amount: amt };
                      });
                      
                      let subTotal = 0;
                      let taxTotal = 0;
                      newLineItems.forEach((item: any) => {
                        subTotal += (item.total || 0);
                        taxTotal += ((item.total || 0) * (item.tax || 0)) / 100;
                      });

                      const currentCharges = Array.isArray(quotationPreview.additionalCharges) ? quotationPreview.additionalCharges : [];
                      const additionalTotal = currentCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

                      setQuotationPreview({
                        ...quotationPreview,
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
                    {quotationPreview.billingCycle === 'days' ? 'Storage Days' : 'Storage Months'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={(quotationPreview.billingCycle === 'days' ? quotationPreview.storageDays : quotationPreview.storageMonths) || (quotationPreview.billingCycle === 'days' ? 30 : 1)}
                    onChange={(e) => {
                      const newVal = Number(e.target.value) || 1;
                      const newCycle = quotationPreview.billingCycle || 'months';
                      const effMonths = newCycle === 'days' ? (newVal / 30) : newVal;
                      
                      const newLineItems = quotationPreview.lineItems.map((item: any) => {
                        const amt = Number(((item.weight || 0) * (item.rate || 0) * effMonths).toFixed(2));
                        return { ...item, months: effMonths, total: amt, amount: amt };
                      });
                      
                      let subTotal = 0;
                      let taxTotal = 0;
                      newLineItems.forEach((item: any) => {
                        subTotal += (item.total || 0);
                        taxTotal += ((item.total || 0) * (item.tax || 0)) / 100;
                      });

                      const currentCharges = Array.isArray(quotationPreview.additionalCharges) ? quotationPreview.additionalCharges : [];
                      const additionalTotal = currentCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

                      setQuotationPreview({
                        ...quotationPreview,
                        [newCycle === 'days' ? 'storageDays' : 'storageMonths']: newVal,
                        lineItems: newLineItems,
                        subTotal,
                        taxTotal,
                        grandTotal: subTotal + taxTotal + additionalTotal,
                      });
                    }}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="bg-neutral-50 dark:bg-neutral-950/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Description / Product
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
                        {quotationPreview.billingCycle === 'days' ? 'Days' : 'Months'}
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
                      <th className="px-6 py-4 text-center w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {quotationPreview.lineItems.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        className="group hover:bg-white dark:hover:bg-neutral-900 transition-colors"
                      >
                        <td className="px-6 py-4">
                          {isManualMode ? (
                            <select
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(idx, "description", e.target.value)
                              }
                              className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none h-10 shadow-sm"
                            >
                              <option value="">Select Product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(idx, "description", e.target.value)
                              }
                              className="w-full bg-transparent font-medium border-0 focus:ring-0 p-0 outline-none text-neutral-900 dark:text-neutral-100"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.quantity || 0}
                            onChange={(e) =>
                              updateLineItem(idx, "quantity", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none h-10 shadow-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.unitWeight || 0}
                            onChange={(e) =>
                              updateLineItem(idx, "unitWeight", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none h-10 shadow-sm"
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
                            value={item.months || 1}
                            onChange={(e) =>
                              updateLineItem(idx, "months", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none h-10 shadow-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.rate || 0}
                            onChange={(e) =>
                              updateLineItem(idx, "rate", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none h-10 shadow-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.tax || 0}
                            onChange={(e) =>
                              updateLineItem(idx, "tax", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none h-10 shadow-sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={7} className="px-6 py-4">
                        <button
                          onClick={addLineItem}
                          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Line Item
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                      const current = Array.isArray(quotationPreview.additionalCharges) ? quotationPreview.additionalCharges : [];
                      const newCharges = [...current, { label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }];
                      const sub = quotationPreview.subTotal || 0;
                      const tax = quotationPreview.taxTotal || 0;
                      const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                      setQuotationPreview({
                        ...quotationPreview,
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
                  {Array.isArray(quotationPreview.additionalCharges) && quotationPreview.additionalCharges.map((charge: any, idx: number) => (
                    <div key={idx} className="bg-neutral-50 dark:bg-neutral-950/50 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 relative group">
                      <button
                        type="button"
                        onClick={() => {
                          const newCharges = quotationPreview.additionalCharges.filter((_: any, i: number) => i !== idx);
                          const sub = quotationPreview.subTotal || 0;
                          const tax = quotationPreview.taxTotal || 0;
                          const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                          setQuotationPreview({ ...quotationPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
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
                                  const newCharges = [...(quotationPreview.additionalCharges || [])];
                                  newCharges[idx].label = e.target.value;
                                  setQuotationPreview({ ...quotationPreview, additionalCharges: newCharges });
                                }}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Type</label>
                              <select
                                value={charge.chargeType || 'quantity'}
                                onChange={(e) => {
                                  const newCharges = [...(quotationPreview.additionalCharges || [])];
                                  newCharges[idx].chargeType = e.target.value as 'fixed' | 'quantity' | 'weight';
                                  if (e.target.value === 'fixed') {
                                    newCharges[idx].value = 0;
                                    newCharges[idx].rate = 0;
                                  } else {
                                    newCharges[idx].amount = (newCharges[idx].value || 0) * (newCharges[idx].rate || 0);
                                  }
                                  const sub = quotationPreview.subTotal || 0;
                                  const tax = quotationPreview.taxTotal || 0;
                                  const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                  setQuotationPreview({ ...quotationPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
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
                                    value={charge.value || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const newCharges = [...(quotationPreview.additionalCharges || [])];
                                      newCharges[idx].value = Number(e.target.value);
                                      newCharges[idx].amount = newCharges[idx].value * (newCharges[idx].rate || 0);
                                      const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                      const sub = quotationPreview.subTotal || 0;
                                      const tax = quotationPreview.taxTotal || 0;
                                      setQuotationPreview({ ...quotationPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
                                    }}
                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Rate (₹)</label>
                                  <input
                                    type="number"
                                    value={charge.rate || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const newCharges = [...(quotationPreview.additionalCharges || [])];
                                      newCharges[idx].rate = Number(e.target.value);
                                      newCharges[idx].amount = newCharges[idx].rate * (newCharges[idx].value || 0);
                                      const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                      const sub = quotationPreview.subTotal || 0;
                                      const tax = quotationPreview.taxTotal || 0;
                                      setQuotationPreview({ ...quotationPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
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
                                  value={charge.amount || ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const newCharges = [...(quotationPreview.additionalCharges || [])];
                                    newCharges[idx].amount = Number(e.target.value);
                                    const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                    const sub = quotationPreview.subTotal || 0;
                                    const tax = quotationPreview.taxTotal || 0;
                                    setQuotationPreview({ ...quotationPreview, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
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
                </div>
                {(!Array.isArray(quotationPreview.additionalCharges) || quotationPreview.additionalCharges.length === 0) && (
                  <div className="group flex flex-col items-center justify-center py-10 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-4xl bg-white dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-all active:scale-[0.99]"
                       onClick={() => {
                          const sub = quotationPreview.subTotal || 0;
                          const tax = quotationPreview.taxTotal || 0;
                          const newCharges = [{ label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }];
                          const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                          setQuotationPreview({
                             ...quotationPreview,
                             additionalCharges: newCharges,
                             grandTotal: sub + tax + additionalTotal
                          });
                       }}>
                    <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-neutral-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Add Additional Charges</p>
                  </div>
                )}
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
                      value={quotationPreview.remarks}
                      onChange={(e) =>
                        setQuotationPreview({
                          ...quotationPreview,
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
                      {quotationPreview.subTotal?.toLocaleString(undefined, {
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
                      {quotationPreview.taxTotal?.toLocaleString(undefined, {
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
                      {(Array.isArray(quotationPreview.additionalCharges) 
                        ? quotationPreview.additionalCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0)
                        : (quotationPreview.additionalCharges || 0)).toLocaleString(undefined, {
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
                        {quotationPreview.grandTotal?.toLocaleString(undefined, {
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
                onClick={() => setIsQuotationModalOpen(false)}
                className="px-8 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button
                onClick={handleSaveQuotation}
                className="px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all hover:shadow-indigo-500/30 shadow-lg active:scale-95 uppercase tracking-widest text-[10px] flex items-center gap-3"
              >
                <FileText className="w-4 h-4" />
                Save & Generate Quotation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Quotation Modal */}
      {isEditQuotationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={() => setIsEditQuotationModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter">
                  Edit Quotation: {quotationFormData.quotationNumber}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
                  Update quotation details and status
                </p>
              </div>
              <button
                onClick={() => setIsEditQuotationModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateQuotation}
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
                      value={quotationFormData.outwardDate || ""}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
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
                      value={quotationFormData.storageMonths || 1}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          storageMonths: Number(e.target.value),
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
                      value={quotationFormData.gst || 0}
                      onChange={(e) => {
                        const newGst = Number(e.target.value);
                        const subTotal = quotationFormData.subTotal || 0;
                        const sumCharges = (charges: any) => {
                          if (!charges) return 0;
                          if (Array.isArray(charges)) return charges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                          return Number(charges) || 0;
                        };
                        const additional = sumCharges(quotationFormData.additionalCharges);
                        const taxTotal = (subTotal * newGst) / 100;
                        setQuotationFormData({
                          ...quotationFormData,
                          gst: newGst,
                          taxTotal,
                          grandTotal: subTotal + taxTotal + additional
                        });
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-full space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Additional Charges</h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-0.5">Extra services, loading or handling fees</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(quotationFormData.additionalCharges) ? quotationFormData.additionalCharges : [];
                        const newCharges = [...current, { label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }];
                        const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                        const sub = quotationFormData.subTotal || 0;
                        const tax = quotationFormData.taxTotal || 0;
                        setQuotationFormData({
                          ...quotationFormData,
                          additionalCharges: newCharges,
                          grandTotal: sub + tax + additionalTotal
                        });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Charge
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(quotationFormData.additionalCharges) && quotationFormData.additionalCharges.map((charge, idx) => (
                      <div key={idx} className="bg-neutral-50 dark:bg-neutral-950/50 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newCharges = (quotationFormData.additionalCharges as any[]).filter((_, i) => i !== idx);
                            const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                            const subTotal = quotationFormData.subTotal || 0;
                            const taxTotal = quotationFormData.taxTotal || 0;
                            setQuotationFormData({ ...quotationFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
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
                                    const newCharges = [...(quotationFormData.additionalCharges || [])];
                                    newCharges[idx].label = e.target.value;
                                    setQuotationFormData({ ...quotationFormData, additionalCharges: newCharges });
                                  }}
                                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Type</label>
                                <select
                                  value={charge.chargeType || 'quantity'}
                                  onChange={(e) => {
                                    const newCharges = [...(quotationFormData.additionalCharges || [])];
                                    newCharges[idx].chargeType = e.target.value as 'fixed' | 'quantity' | 'weight';
                                    if (e.target.value === 'fixed') { 
                                      newCharges[idx].value = 0; 
                                      newCharges[idx].rate = 0; 
                                    } else {
                                      newCharges[idx].amount = (newCharges[idx].value || 0) * (newCharges[idx].rate || 0);
                                    }
                                    const sub = quotationFormData.subTotal || 0;
                                    const tax = quotationFormData.taxTotal || 0;
                                    const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                    setQuotationFormData({ ...quotationFormData, additionalCharges: newCharges, grandTotal: sub + tax + additionalTotal });
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
                                      value={charge.value || ''}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const newCharges = [...(quotationFormData.additionalCharges || [])];
                                        newCharges[idx].value = Number(e.target.value);
                                        newCharges[idx].amount = newCharges[idx].value * (newCharges[idx].rate || 0);
                                        const subTotal = quotationFormData.subTotal || 0;
                                        const taxTotal = quotationFormData.taxTotal || 0;
                                        const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                        setQuotationFormData({ ...quotationFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
                                      }}
                                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Rate</label>
                                    <input
                                      type="number"
                                      value={charge.rate || ''}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const newCharges = [...(quotationFormData.additionalCharges || [])];
                                        newCharges[idx].rate = Number(e.target.value);
                                        newCharges[idx].amount = newCharges[idx].rate * (newCharges[idx].value || 0);
                                        const subTotal = quotationFormData.subTotal || 0;
                                        const taxTotal = quotationFormData.taxTotal || 0;
                                        const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                                        setQuotationFormData({ ...quotationFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
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
                                    value={charge.amount || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const newCharges = [...(quotationFormData.additionalCharges || [])];
                                      newCharges[idx].amount = Number(e.target.value);
                                      const subTotal = quotationFormData.subTotal || 0;
                                      const taxTotal = quotationFormData.taxTotal || 0;
                                      const additionalTotal = newCharges.reduce((acc: number, c) => acc + (c.amount || 0), 0);
                                      setQuotationFormData({ ...quotationFormData, additionalCharges: newCharges, grandTotal: subTotal + taxTotal + additionalTotal });
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
                    {(!Array.isArray(quotationFormData.additionalCharges) || quotationFormData.additionalCharges.length === 0) && (
                      <div 
                         onClick={() => {
                            const sub = quotationFormData.subTotal || 0;
                            const tax = quotationFormData.taxTotal || 0;
                            const newCharges = [{ label: '', chargeType: 'quantity' as const, unit: 'Qty', value: 0, rate: 0, amount: 0 }];
                            const additionalTotal = newCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                            setQuotationFormData({
                               ...quotationFormData,
                               additionalCharges: newCharges,
                               grandTotal: sub + tax + additionalTotal
                            });
                         }}
                         className="col-span-full group flex flex-col items-center justify-center py-10 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-4xl bg-white dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6 text-neutral-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Add Extra Charges</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Status
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={quotationFormData.status || "Pending"}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
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
                      value={quotationFormData.paymentMode || "Cash"}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
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
                  value={quotationFormData.remarks || ""}
                  onChange={(e) =>
                    setQuotationFormData({
                      ...quotationFormData,
                      remarks: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="mt-8 flex justify-end gap-5">
                <button
                  type="button"
                  onClick={() => setIsEditQuotationModalOpen(false)}
                  className="px-8 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Update Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quotation Preview Modal */}
      {quotationPreviewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm print:bg-white print:z-auto print:block print:relative print:p-0 p-4">
          <div className="flex flex-col max-h-[95vh] w-full max-w-5xl bg-slate-100 rounded-lg shadow-2xl relative print:h-auto print:max-h-none print:shadow-none print:bg-white">
            {/* Modal Header controls (Hidden on Print) */}
            <div className="flex justify-between items-center p-4 bg-white border-b print:hidden rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Quotation Preview
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Quotation
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
                  onClick={() => setQuotationPreviewData(null)}
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
                const items = quotationPreviewData.quotation.lineItems;
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

                      {/* Party & Quotation Info Row */}
                      <div className="flex border-b border-black">
                        <div className="w-1/2 p-3 border-r border-black flex flex-col gap-1.5 text-xs font-bold font-mono text-left">
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              M/S:
                            </span>{" "}
                            <span className="uppercase text-sm leading-tight ml-2">
                              {quotationPreviewData.partyDetails?.partyName || quotationPreviewData.quotation.partyId}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              GST:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {quotationPreviewData.partyDetails?.gstNumber ||
                                "Unregistered"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              PAN:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {quotationPreviewData.partyDetails?.panNumber ||
                                "-"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              Ph:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {quotationPreviewData.partyDetails?.mobileNo || "-"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              Email:
                            </span>{" "}
                            <span className="ml-2 leading-tight truncate uppercase">
                              {quotationPreviewData.partyDetails?.email || "-"}
                            </span>
                          </div>
                          {quotationPreviewData.partyDetails?.address && (
                            <div className="flex mt-1 text-[10px] text-slate-600 leading-tight">
                              <span className="w-16 flex-shrink-0">ADD:</span>
                              <span className="uppercase ml-2">
                                {quotationPreviewData.partyDetails.address},{" "}
                                {quotationPreviewData.partyDetails.city}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-1/2 p-3 flex flex-col gap-1.5 text-xs font-bold relative font-mono text-left">
                          <div className="absolute top-2 right-0 left-0 text-center font-black text-sm tracking-widest uppercase">
                            TAX QUOTATION
                          </div>
                          <div className="mt-6 flex flex-col gap-2 relative z-10 uppercase">
                            <div>CASH/CREDIT Memo</div>
                            <div>
                              SAC: {companySettings?.sacCode || "996721"}
                            </div>
                            <div>
                              Quo No: {quotationPreviewData.quotation.quotationNumber}
                            </div>
                            <div>
                              Date: {formatDate(new Date().toISOString())}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
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
                          {quotationPreviewData.quotation.billingCycle === 'days' ? 'Days' : 'Mon.'}
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
                              {formatDate(item.inDate || quotationPreviewData.quotation.date)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {formatDate(item.outDate || quotationPreviewData.quotation.outwardDate)}
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
                              {quotationPreviewData.quotation.billingCycle === 'days' 
                                ? (quotationPreviewData.quotation.storageDays || 30) 
                                : (quotationPreviewData.quotation.storageMonths || item.months || 1)}
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
                          <div className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] border-t-2 border-black font-black bg-neutral-50/50 items-center min-h-8 text-center text-black">
                            <div className="col-span-3 px-2 text-right border-r border-black/20 uppercase tracking-tighter pr-4">Total:</div>
                            <div className="px-1 border-r border-black/20 flex items-center justify-center h-full">{totalQty}</div>
                            <div className="px-1 border-r border-black/20"></div>
                            <div className="px-1 border-r border-black/20 flex items-center justify-center h-full">{totalWt.toFixed(2)}</div>
                            <div className="col-span-3"></div>
                          </div>
                        )}
                      </div>

                      {/* Totals Row - ONLY ON LAST PAGE */}
                      {pageIdx === chunks.length - 1 ? (
                        <>
                          <div className="flex border-b border-black min-h-36 flex-wrap">
                            <div className="w-1/2 p-4 font-semibold text-xs border-r border-black flex flex-col gap-1.5 font-mono leading-tight bg-slate-50/30 text-left">
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Remarks :
                                </span>{" "}
                                <span className="text-black uppercase">
                                  {quotationPreviewData.quotation.remarks ||
                                    "QUOTATION"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Bank Detail:
                                </span>{" "}
                                <span className="text-black uppercase tracking-tighter">
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
                            <div className="w-1/2 flex flex-col font-bold text-xs p-4 font-mono bg-white text-right">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                    Sub Total:
                                  </span>{" "}
                                  <span className="text-base text-black">
                                    ₹
                                    {Number(
                                      quotationPreviewData.quotation.subTotal || 0,
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600">
                                  <span className="font-bold uppercase tracking-tighter">
                                    Add. Charges:
                                  </span>{" "}
                                  <span className="text-black">
                                    ₹
                                    {Number(
                                      quotationPreviewData.quotation.additionalCharges || 0,
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                {(quotationPreviewData.quotation.taxTotal || 0) >
                                  0 && (
                                    <>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                          SGST @ {Number((quotationPreviewData.quotation.gst || 18) / 2).toFixed(1)}%:
                                        </span>{" "}
                                        <span className="text-black">
                                          ₹
                                          {Number(
                                            (quotationPreviewData.quotation.taxTotal ||
                                              0) / 2,
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                          CGST @ {Number((quotationPreviewData.quotation.gst || 18) / 2).toFixed(1)}%:
                                        </span>{" "}
                                        <span className="text-black">
                                          ₹
                                          {Number(
                                            (quotationPreviewData.quotation.taxTotal ||
                                              0) / 2,
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                {(() => {
                                   const charges = quotationPreviewData.quotation.additionalCharges;
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
                              </div>
                              <div className="flex justify-between items-center border-t border-black pt-2 mt-2 text-lg font-black bg-slate-900 text-white p-2 rounded-lg">
                                <span className="uppercase tracking-tighter text-xs text-indigo-300">
                                  Net Amount:
                                </span>
                                <span>
                                  ₹
                                  {Number(
                                    quotationPreviewData.quotation.grandTotal || 0,
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Words Row */}
                          <div className="border-b border-black p-3 font-bold text-[11px] uppercase font-mono bg-slate-100 flex items-center gap-3 text-left">
                            <span className="text-slate-500 font-black italic">
                              Amount in words:
                            </span>
                            <span className="text-black">
                              {numberToWords(
                                Number(quotationPreviewData.quotation.grandTotal || 0),
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

                      {/* Footer text */}
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
                       <p className="text-sm font-black italic">#{quotationPreviewData.quotation.quotationNumber}</p>
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
                          "This quotation is valid for a period of 30 days from the date of issuance.",
                          "Rates quoted are based on current market conditions and are subject to revision if not accepted within the validity period.",
                          "GST and other government taxes will be applicable extra as per the prevailing rates.",
                          "Payment terms: 100% advance or as per mutually agreed contract terms.",
                          "The warehouse reserves the right to revise storage rates with 15 days' notice.",
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
                       Continued from Page 1 — Ref No: {quotationPreviewData.quotation.quotationNumber}
                     </div>
                     <div className="text-center w-48">
                       <div className="border-t border-black pt-2 text-[10px] font-black uppercase">
                          Authorized Acceptance
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
