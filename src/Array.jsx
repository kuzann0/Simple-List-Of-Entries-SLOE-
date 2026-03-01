import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';



function Array() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("entriesList");
    return savedEntries ? JSON.parse(savedEntries) : [];
  });

  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({
    entryNumber: "",
    modelName: "",
    serialNumber: "",
    propertyNumber: "",
    conditionStatus: "",
    remarks: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showAddStatusMenu, setShowAddStatusMenu] = useState(false);
  const [addStatusValue, setAddStatusValue] = useState("");
  const [showEditStatusMenu, setShowEditStatusMenu] = useState(false);
  const [nextEntryNumber, setNextEntryNumber] = useState("0001");  const [remarksHistory, setRemarksHistory] = useState(() => {
    const saved = localStorage.getItem("remarksHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [remarksInput, setRemarksInput] = useState("");
  const [showRemarksHints, setShowRemarksHints] = useState(false);
  const [filteredRemarks, setFilteredRemarks] = useState([]);
  const [modelNameHistory, setModelNameHistory] = useState(() => {
    const saved = localStorage.getItem("modelNameHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [modelNameInput, setModelNameInput] = useState("");
  const [showModelNameHints, setShowModelNameHints] = useState(false);
  const [filteredModelNames, setFilteredModelNames] = useState([]);
  const [downloadCounter, setDownloadCounter] = useState(() => {
    const saved = localStorage.getItem("downloadCounter");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [addEntryNumberEditable, setAddEntryNumberEditable] = useState(false);
  const [editEntryNumberEditable, setEditEntryNumberEditable] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, index: null });
  const [warnings, setWarnings] = useState({ show: false, type: null, message: "", action: null });

  useEffect(() => {
    localStorage.setItem("entriesList", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("remarksHistory", JSON.stringify(remarksHistory));
  }, [remarksHistory]);

  useEffect(() => {
    localStorage.setItem("modelNameHistory", JSON.stringify(modelNameHistory));
  }, [modelNameHistory]);

  useEffect(() => {
    localStorage.setItem("downloadCounter", downloadCounter.toString());
  }, [downloadCounter]);

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    if (entries.length === 0) {
      setNextEntryNumber("0001");
      if (document.getElementById("entryNumber")) {
        document.getElementById("entryNumber").value = "0001";
      }
    } else {
      const numbers = entries
        .map(entry => parseInt(entry.entryNumber, 10))
        .filter(num => !isNaN(num));
      if (numbers.length > 0) {
        const maxNum = Math.max(...numbers);
        const nextNum = (maxNum + 1).toString().padStart(4, '0');
        setNextEntryNumber(nextNum);
        if (document.getElementById("entryNumber")) {
          document.getElementById("entryNumber").value = nextNum;
        }
      }
    }
  }, [entries]);

  function checkSequenceGaps() {
    if (entries.length < 2) return null;
    
    const numbers = entries
      .map(entry => parseInt(entry.entryNumber, 10))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    const gaps = [];
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i + 1] - numbers[i] > 1) {
        gaps.push(`Between ${numbers[i]} and ${numbers[i + 1]}`);
      }
    }
    
    return gaps.length > 0 ? gaps : null;
  }

  function checkExactDuplicate(entryData, excludeIndex = null) {
    return entries.some((entry, idx) => {
      if (excludeIndex !== null && idx === excludeIndex) return false;
      return (
        entry.modelName === entryData.modelName &&
        entry.serialNumber === entryData.serialNumber &&
        entry.propertyNumber === entryData.propertyNumber &&
        entry.conditionStatus === entryData.conditionStatus &&
        entry.remarks === entryData.remarks
      );
    });
  }

  function checkSerialPropertyDuplicate(serialNumber, propertyNumber, excludeIndex = null) {
    return entries.some((entry, idx) => {
      if (excludeIndex !== null && idx === excludeIndex) return false;
      return (
        entry.serialNumber === serialNumber &&
        entry.propertyNumber === propertyNumber
      );
    });
  }

  function checkPropertyNumberDuplicate(propertyNumber, excludeIndex = null) {
    return entries.some((entry, idx) => {
      if (excludeIndex !== null && idx === excludeIndex) return false;
      return entry.propertyNumber === propertyNumber;
    });
  }

  function handleAddEntry() {
    const entryNumberVal = document.getElementById("entryNumber").value;
    const modelNameVal = document.getElementById("modelName").value;
    const serialNumberVal = document.getElementById("serialNumber").value;
    const propertyNumberVal = document.getElementById("propertyNumber").value;
    const remarksVal = document.getElementById("remarks").value;
    
    const errors = {};
    
    if (!entryNumberVal) errors.entryNumber = "Entry No. is required";
    if (!modelNameVal) errors.modelName = "Model Name is required";
    if (!serialNumberVal) errors.serialNumber = "Serial No. is required";
    if (!propertyNumberVal) errors.propertyNumber = "Property No. is required";
    if (!addStatusValue) errors.status = "Service Status is required";
    
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    
    // Check for duplicate entry number
    if (entries.some(e => e.entryNumber === entryNumberVal)) {
      setAddErrors({ entryNumber: `Entry number ${entryNumberVal} already exists!` });
      return;
    }

    // Check for duplicate property number
    if (checkPropertyNumberDuplicate(propertyNumberVal)) {
      setAddErrors({ propertyNumber: `Property Number "${propertyNumberVal}" already exists!` });
      return;
    }

    // Check for duplicate Serial Number + Property Number combination
    if (checkSerialPropertyDuplicate(serialNumberVal, propertyNumberVal)) {
      setWarnings({
        show: true,
        type: "duplicate_serial_property",
        message: `WARNING: An entry with Serial No. "${serialNumberVal}" and Property No. "${propertyNumberVal}" already exists! This combination must be unique.`,
        action: { confirm: "Understood", cancel: null },
        onConfirm: () => setWarnings({ show: false, type: null, message: "", action: null }),
        onCancel: null
      });
      return;
    }

    const now = new Date().toLocaleString();
    const newEntry = {
      id: Date.now(),
      entryNumber: entryNumberVal,
      modelName: modelNameVal,
      serialNumber: serialNumberVal,
      propertyNumber: propertyNumberVal,
      conditionStatus: addStatusValue,
      remarks: remarksVal,
      createdAt: now,
      updatedAt: now
    };

    // Check for exact duplicate (same details)
    if (checkExactDuplicate(newEntry)) {
      setWarnings({
        show: true,
        type: "exact_duplicate",
        message: "WARNING: An entry with the EXACT SAME details (Model Name, Serial No., Property No., Status, Remarks) already exists!",
        action: { confirm: "Add Anyway", cancel: "Cancel" },
        onConfirm: () => addEntryWithWarningAcknowledged(newEntry),
        onCancel: () => setWarnings({ show: false, type: null, message: "", action: null })
      });
      return;
    }

    // Check for sequence gaps
    const gaps = checkSequenceGaps();
    if (gaps && gaps.length > 0) {
      setWarnings({
        show: true,
        type: "sequence_gap",
        message: `Entry number gaps detected: ${gaps.join(", ")}. New entry number ${entryNumberVal} will be added.`,
        action: { confirm: "Continue", cancel: "Cancel" },
        onConfirm: () => addEntryWithWarningAcknowledged(newEntry),
        onCancel: () => setWarnings({ show: false, type: null, message: "", action: null })
      });
      return;
    }

    addEntryWithWarningAcknowledged(newEntry);
  }

  function addEntryWithWarningAcknowledged(newEntry) {
    const modelNameVal = newEntry.modelName;
    const remarksVal = newEntry.remarks;

    if (modelNameVal && !modelNameHistory.includes(modelNameVal)) {
      setModelNameHistory([modelNameVal, ...modelNameHistory.slice(0, 9)]);
    }

    if (remarksVal && !remarksHistory.includes(remarksVal)) {
      setRemarksHistory([remarksVal, ...remarksHistory.slice(0, 9)]);
    }

    document.getElementById("entryNumber").value = nextEntryNumber;
    document.getElementById("modelName").value = "";
    document.getElementById("serialNumber").value = "";
    document.getElementById("propertyNumber").value = "";
    document.getElementById("remarks").value = "";
    setModelNameInput("");
    setRemarksInput("");
    setAddStatusValue("");
    setAddErrors({});
    setAddEntryNumberEditable(false);

    setEntries(f => [...f, newEntry]);
  }
  function handleRemoveEntry(index) {
    setDeleteConfirm({ show: true, index });
  }

  function confirmDelete() {
    if (deleteConfirm.index !== null) {
      setEntries(entries.filter((_, i) => i !== deleteConfirm.index));
      setDeleteConfirm({ show: false, index: null });
    }
  }

  function cancelDelete() {
    setDeleteConfirm({ show: false, index: null });
  }

  function handleEditEntry(index) {
    setEditingIndex(index);
    setEditData({ ...entries[index] });
  }

  function handleSaveEdit() {
    const errors = {};
    
    if (!editData.entryNumber) errors.entryNumber = "Entry No. is required";
    if (!editData.modelName) errors.modelName = "Model Name is required";
    if (!editData.serialNumber) errors.serialNumber = "Serial No. is required";
    if (!editData.propertyNumber) errors.propertyNumber = "Property No. is required";
    if (!editData.conditionStatus) errors.status = "Service Status is required";
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    
    // Check for duplicate entry number (excluding current entry)
    const isDuplicate = entries.some((e, idx) => 
      e.entryNumber === editData.entryNumber && idx !== editingIndex
    );
    if (isDuplicate) {
      setEditErrors({ entryNumber: `Entry number ${editData.entryNumber} already exists!` });
      return;
    }

    // Check for duplicate property number (excluding current entry)
    if (checkPropertyNumberDuplicate(editData.propertyNumber, editingIndex)) {
      setEditErrors({ propertyNumber: `Property Number "${editData.propertyNumber}" already exists!` });
      return;
    }

    // Check for duplicate Serial Number + Property Number combination (excluding current entry)
    if (checkSerialPropertyDuplicate(editData.serialNumber, editData.propertyNumber, editingIndex)) {
      setWarnings({
        show: true,
        type: "duplicate_serial_property",
        message: `WARNING: Another entry with Serial No. "${editData.serialNumber}" and Property No. "${editData.propertyNumber}" already exists! This combination must be unique.`,
        action: { confirm: "Understood", cancel: null },
        onConfirm: () => setWarnings({ show: false, type: null, message: "", action: null }),
        onCancel: null
      });
      return;
    }

    // Check for exact duplicate (same details, excluding current entry)
    if (checkExactDuplicate(editData, editingIndex)) {
      setWarnings({
        show: true,
        type: "exact_duplicate",
        message: "WARNING: Another entry with the EXACT SAME details (Model Name, Serial No., Property No., Status, Remarks) already exists!",
        action: { confirm: "Save Anyway", cancel: "Cancel" },
        onConfirm: () => saveEditWithWarningAcknowledged(),
        onCancel: () => setWarnings({ show: false, type: null, message: "", action: null })
      });
      return;
    }

    // Check for sequence gaps
    const gaps = checkSequenceGaps();
    if (gaps && gaps.length > 0) {
      setWarnings({
        show: true,
        type: "sequence_gap",
        message: `Entry number gaps detected: ${gaps.join(", ")}. Your edit will be saved.`,
        action: { confirm: "Continue", cancel: "Cancel" },
        onConfirm: () => saveEditWithWarningAcknowledged(),
        onCancel: () => setWarnings({ show: false, type: null, message: "", action: null })
      });
      return;
    }

    saveEditWithWarningAcknowledged();
  }

  function saveEditWithWarningAcknowledged() {
    const updatedEntries = [...entries];
    updatedEntries[editingIndex] = {
      ...editData,
      updatedAt: new Date().toLocaleString()
    };
    setEntries(updatedEntries);
    setEditingIndex(null);
    setEditErrors({});
    setEditEntryNumberEditable(false);
    setWarnings({ show: false, type: null, message: "", action: null });
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditEntryNumberEditable(false);
  }

  function handleRemarksChange(value) {
    setRemarksInput(value);
    document.getElementById("remarks").value = value;
    
    if (value.trim()) {
      const filtered = remarksHistory.filter(remark => 
        remark.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredRemarks(filtered);
      setShowRemarksHints(filtered.length > 0);
    } else {
      setShowRemarksHints(false);
    }
  }

  function handleRemarksHintClick(remark) {
    setRemarksInput(remark);
    document.getElementById("remarks").value = remark;
    setShowRemarksHints(false);
  }

  function handleModelNameChange(value) {
    setModelNameInput(value);
    document.getElementById("modelName").value = value;
    
    if (value.trim()) {
      const filtered = modelNameHistory.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredModelNames(filtered);
      setShowModelNameHints(filtered.length > 0);
    } else {
      setShowModelNameHints(false);
    }
  }

  function handleModelNameHintClick(modelName) {
    setModelNameInput(modelName);
    document.getElementById("modelName").value = modelName;
    setShowModelNameHints(false);
  }

  function handleEditDataChange(field, value) {
    setEditData({ ...editData, [field]: value });
  }

  function getFilteredEntries() {
    let result = entries;
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(entry => entry.conditionStatus === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      
      result = result.filter((entry) => {
        if (searchCategory === "all") {
          return (
            entry.entryNumber.toLowerCase().includes(term) ||
            entry.modelName.toLowerCase().includes(term) ||
            entry.serialNumber.toLowerCase().includes(term) ||
            entry.propertyNumber.toLowerCase().includes(term) ||
            entry.conditionStatus.toLowerCase().includes(term) ||
            entry.remarks.toLowerCase().includes(term)
          );
        } else if (searchCategory === "entryNumber") {
          return entry.entryNumber.toLowerCase().includes(term);
        } else if (searchCategory === "modelName") {
          return entry.modelName.toLowerCase().includes(term);
        } else if (searchCategory === "serialNumber") {
          return entry.serialNumber.toLowerCase().includes(term);
        } else if (searchCategory === "propertyNumber") {
          return entry.propertyNumber.toLowerCase().includes(term);
        } else if (searchCategory === "conditionStatus") {
          return entry.conditionStatus.toLowerCase().includes(term);
        } else if (searchCategory === "remarks") {
          return entry.remarks.toLowerCase().includes(term);
        }
        return true;
      });

      // Sort results to prioritize exact matches for entry numbers
      if (searchCategory === "entryNumber" || searchCategory === "all") {
        result = result.sort((a, b) => {
          const aExact = a.entryNumber.toLowerCase() === term ? 0 : 1;
          const bExact = b.entryNumber.toLowerCase() === term ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          // Secondary sort by entry number descending
          return parseInt(b.entryNumber, 10) - parseInt(a.entryNumber, 10);
        });
        return result;
      }
    }

    // Sort all results by entry number descending (newest first)
    return result.sort((a, b) => {
      return parseInt(b.entryNumber, 10) - parseInt(a.entryNumber, 10);
    });
  }

  function handleSearchResultClick(entry) {
    const element = document.querySelector(`[data-entry-number="${entry.entryNumber}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = '#ffffcc';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
    setShowDropdown(false);
    
    // Add to search history
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
  }

  function exportToCSV() {
    if (entries.length === 0) {
      alert("No entries to export");
      return;
    }
    
    const headers = ["Entry No.", "Model Name", "Serial No.", "Property No.", "Service Status", "Remarks", "Created", "Updated"];
    const rows = entries.map(e => [
      e.entryNumber,
      e.modelName || "",
      e.serialNumber,
      e.propertyNumber,
      e.conditionStatus,
      e.remarks,
      e.createdAt || "",
      e.updatedAt || ""
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${new Date().toISOString().split('T')[0]} - entries.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importFromJSON() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            setEntries(imported);
            alert(`Successfully imported ${imported.length} entries`);
          } else {
            alert("Invalid file format");
          }
        } catch (err) {
          alert("Error importing file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function toggleEntrySelection(index) {
    const entryId = entries[index].id;
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  }

  function deleteBulkEntries() {
    if (selectedEntries.length === 0) {
      alert("Select entries to delete");
      return;
    }
    if (confirm(`Delete ${selectedEntries.length} entries?`)) {
      setEntries(entries.filter(e => !selectedEntries.includes(e.id)));
      setSelectedEntries([]);
      setBulkDeleteMode(false);
    }
  }

  function getStatistics() {
    const total = entries.length;
    const serviceable = entries.filter(e => e.conditionStatus === "Serviceable (SVC)").length;
    const unserviceable = entries.filter(e => e.conditionStatus === "Unserviceable (UNSVC)").length;
    const updateMasterlist = entries.filter(e => e.conditionStatus === "Update (Masterlist)").length;
    return { total, serviceable, unserviceable, updateMasterlist };
  }

  function clearAllEntries() {
    if (confirm("Clear all entries? This cannot be undone.")) {
      setEntries([]);
      setSelectedEntries([]);
      setBulkDeleteMode(false);
    }
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 10;
    const stats = getStatistics();

    // Title
    doc.setFontSize(16);
    doc.text('Entries List', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setDrawColor(0);
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 8;

    // Statistics
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY', 15, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`Total Entries: ${stats.total}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Serviceable: ${stats.serviceable}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Unserviceable: ${stats.unserviceable}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Update (Masterlist): ${stats.updateMasterlist}`, 20, yPosition);
    yPosition += 8;

    doc.setDrawColor(0);
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Entries
    doc.setFontSize(10);
    entries.forEach((entry, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 10;
      }

      // Entry content
      doc.setFont(undefined, 'bold');
      doc.text(`Entry ${index + 1}`, 15, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Entry No.: ${entry.entryNumber}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Model Name: ${entry.modelName || "N/A"}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Serial No.: ${entry.serialNumber}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Property No.: ${entry.propertyNumber}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Service Status: ${entry.conditionStatus}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Remarks: ${entry.remarks}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Created: ${entry.createdAt || "N/A"}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Updated: ${entry.updatedAt || "N/A"}`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 6;
    });

    // Generate filename with date and incrementing counter
    const today = new Date().toISOString().split('T')[0];
    const newCounter = downloadCounter + 1;
    const filename = `${today} - ENTRY - ${newCounter}.pdf`;
    setDownloadCounter(newCounter);

    // Download
    doc.save(filename);
  }

  const stats = getStatistics();
  
  return (
    <div>
      <h2>Simple List Of Entries (SLOE) | ɘlv!s</h2>
      
      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-box">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-box serviceable">
          <div className="stat-number">{stats.serviceable}</div>
          <div className="stat-label">Serviceable (SVC)</div>
        </div>
        <div className="stat-box unserviceable">
          <div className="stat-number">{stats.unserviceable}</div>
          <div className="stat-label">Unserviceable (UNSVC)</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{stats.updateMasterlist}</div>
          <div className="stat-label">Update (Masterlist)</div>
        </div>
      </div>
      
      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          className="search-bar"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => searchTerm && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        <div className="category-filter">
          <button
            className="category-button"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            onBlur={() => setTimeout(() => setShowCategoryMenu(false), 200)}
          >
            <span className="category-label">
              {searchCategory === "all" ? "All" :
               searchCategory === "entryNumber" ? "Entry No." :
               searchCategory === "modelName" ? "Model Name" :
               searchCategory === "serialNumber" ? "Serial No." :
               searchCategory === "propertyNumber" ? "Property No." :
               searchCategory === "conditionStatus" ? "Status" :
               "Remarks"}
            </span>
            <svg className="category-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {showCategoryMenu && (
            <div className="category-menu">
              <div className="category-option" onClick={() => { setSearchCategory("all"); setShowCategoryMenu(false); }}>All Fields</div>
              <div className="category-option" onClick={() => { setSearchCategory("entryNumber"); setShowCategoryMenu(false); }}>Entry No.</div>
              <div className="category-option" onClick={() => { setSearchCategory("modelName"); setShowCategoryMenu(false); }}>Model Name</div>
              <div className="category-option" onClick={() => { setSearchCategory("serialNumber"); setShowCategoryMenu(false); }}>Serial No.</div>
              <div className="category-option" onClick={() => { setSearchCategory("propertyNumber"); setShowCategoryMenu(false); }}>Property No.</div>
              <div className="category-option" onClick={() => { setSearchCategory("conditionStatus"); setShowCategoryMenu(false); }}>Service Status</div>
              <div className="category-option" onClick={() => { setSearchCategory("remarks"); setShowCategoryMenu(false); }}>Remarks</div>
            </div>
          )}
        </div>
        {showDropdown && searchTerm && getFilteredEntries().length > 0 && (
          <div className="search-dropdown">
            {getFilteredEntries().map((entry, idx) => (
              <div
                key={idx}
                className="search-result-item"
                onClick={() => handleSearchResultClick(entry)}
              >
                <strong>{entry.entryNumber}</strong>
                <span className="search-result-meta">{entry.serialNumber}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Status Filter Buttons */}
      <div className="status-filter-buttons">
        <button 
          className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All ({stats.total})
        </button>
        <button 
          className={`filter-btn serviceable ${statusFilter === "Serviceable (SVC)" ? "active" : ""}`}
          onClick={() => setStatusFilter("Serviceable (SVC)")}
        >
          Serviceable (SVC) ({stats.serviceable})
        </button>
        <button 
          className={`filter-btn unserviceable ${statusFilter === "Unserviceable (UNSVC)" ? "active" : ""}`}
          onClick={() => setStatusFilter("Unserviceable (UNSVC)")}
        >
          Unserviceable (UNSVC) ({stats.unserviceable})
        </button>
        <button 
          className={`filter-btn ${statusFilter === "Update (Masterlist)" ? "active" : ""}`}
          onClick={() => setStatusFilter("Update (Masterlist)")}
        >
          Update (Masterlist) ({stats.updateMasterlist})
        </button>
      </div>
      
      <div className="button-toolbar">
        <button onClick={downloadPDF} className="download-pdf-btn">
          <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download as PDF
        </button>
        <button onClick={exportToCSV} className="export-btn">
          Export CSV
        </button>
        <button onClick={importFromJSON} className="export-btn">
          Import JSON
        </button>
        <button onClick={() => setBulkDeleteMode(!bulkDeleteMode)} className={`bulk-mode-btn ${bulkDeleteMode ? "active" : ""}`}>
          {bulkDeleteMode ? "Cancel" : "Bulk Delete"}
        </button>
        {bulkDeleteMode && selectedEntries.length > 0 && (
          <button onClick={deleteBulkEntries} className="delete-bulk-btn">
            Delete {selectedEntries.length}
          </button>
        )}
        <button onClick={clearAllEntries} className="clear-all-btn">
          Clear All
        </button>
      </div>
      <div className="form-container">
        <h3>Add New Entry</h3>
        <div className={`input-wrapper entry-number-wrapper ${addErrors.entryNumber ? "error" : ""}`}>
          <input 
            type="text" 
            id="entryNumber" 
            placeholder="Entry No." 
            value={nextEntryNumber}
            disabled={!addEntryNumberEditable}
            readOnly={!addEntryNumberEditable}
            onChange={() => setAddErrors({...addErrors, entryNumber: null})}
          ></input>
          <button 
            type="button"
            className="entry-number-edit-btn"
            onClick={() => {
              setAddEntryNumberEditable(!addEntryNumberEditable);
              if (!addEntryNumberEditable) {
                setTimeout(() => document.getElementById("entryNumber").focus(), 0);
              }
            }}
            title="Edit Entry Number"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          {addErrors.entryNumber && <div className="error-message">{addErrors.entryNumber}</div>}
        </div>
        <div className={`input-wrapper model-name-wrapper ${addErrors.modelName ? "error" : ""}`}>
          <input 
            type="text" 
            id="modelName" 
            placeholder="Model Name"
            value={modelNameInput}
            onChange={(e) => {
              handleModelNameChange(e.target.value);
              setAddErrors({...addErrors, modelName: null});
            }}
            onFocus={(e) => {
              if (e.target.value && modelNameHistory.some(m => m.toLowerCase().includes(e.target.value.toLowerCase()))) {
                setShowModelNameHints(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowModelNameHints(false), 200)}
          ></input>
          {showModelNameHints && filteredModelNames.length > 0 && (
            <div className="model-name-hints">
              {filteredModelNames.map((modelName, idx) => (
                <div
                  key={idx}
                  className="model-name-option"
                  onClick={() => handleModelNameHintClick(modelName)}
                >
                  {modelName}
                </div>
              ))}
            </div>
          )}
          {addErrors.modelName && <div className="error-message">{addErrors.modelName}</div>}
        </div>
        <div className={`input-wrapper ${addErrors.serialNumber ? "error" : ""}`}>
          <input type="text" id="serialNumber" placeholder="Serial No." onChange={() => setAddErrors({...addErrors, serialNumber: null})}></input>
          {addErrors.serialNumber && <div className="error-message">{addErrors.serialNumber}</div>}
        </div>
        <div className={`input-wrapper ${addErrors.propertyNumber ? "error" : ""}`}>
          <input type="text" id="propertyNumber" placeholder="Property No." onChange={() => setAddErrors({...addErrors, propertyNumber: null})}></input>
          {addErrors.propertyNumber && <div className="error-message">{addErrors.propertyNumber}</div>}
        </div>
        <div className={`input-wrapper ${addErrors.status ? "error" : ""}`}>
          <div className="status-filter">
            <button
              className="status-button"
              onClick={() => {
                setShowAddStatusMenu(!showAddStatusMenu);
                setAddErrors({...addErrors, status: null});
              }}
              onBlur={() => setTimeout(() => setShowAddStatusMenu(false), 200)}
            >
              <span className="status-label">
                {addStatusValue === "" ? "Select Service Status" :
                 addStatusValue === "Serviceable (SVC)" ? "Serviceable (SVC)" :
                 addStatusValue === "Unserviceable (UNSVC)" ? "Unserviceable (UNSVC)" :
                 "Update (Masterlist)"}
              </span>
              <svg className="status-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {showAddStatusMenu && (
              <div className="status-menu">
                <div className="status-option" onClick={() => { setAddStatusValue("Serviceable (SVC)"); setShowAddStatusMenu(false); setAddErrors({...addErrors, status: null}); }}>Serviceable (SVC)</div>
                <div className="status-option" onClick={() => { setAddStatusValue("Unserviceable (UNSVC)"); setShowAddStatusMenu(false); setAddErrors({...addErrors, status: null}); }}>Unserviceable (UNSVC)</div>
                <div className="status-option" onClick={() => { setAddStatusValue("Update (Masterlist)"); setShowAddStatusMenu(false); setAddErrors({...addErrors, status: null}); }}>Update (Masterlist)</div>
              </div>
            )}
          </div>
          {addErrors.status && <div className="error-message">{addErrors.status}</div>}
        </div>
        <div className={`input-wrapper remarks-wrapper ${addErrors.remarks ? "error" : ""}`}>
          <input 
            type="text" 
            id="remarks" 
            placeholder="Remarks"
            value={remarksInput}
            onChange={(e) => {
              handleRemarksChange(e.target.value);
              setAddErrors({...addErrors, remarks: null});
            }}
            onFocus={(e) => {
              if (e.target.value && remarksHistory.some(r => r.toLowerCase().includes(e.target.value.toLowerCase()))) {
                setShowRemarksHints(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowRemarksHints(false), 200)}
          ></input>
          {showRemarksHints && filteredRemarks.length > 0 && (
            <div className="remarks-hints">
              {filteredRemarks.map((remark, idx) => (
                <div
                  key={idx}
                  className="remarks-option"
                  onClick={() => handleRemarksHintClick(remark)}
                >
                  {remark}
                </div>
              ))}
            </div>
          )}
          {addErrors.remarks && <div className="error-message">{addErrors.remarks}</div>}
        </div>
        <button onClick={handleAddEntry} className="add-entry-btn">Add Entry</button>
      </div>

      <ul>
        {entries.length === 0 ? (
          <li className="empty-state">No entries yet</li>
        ) : getFilteredEntries().length === 0 ? (
          <li className="empty-state">No results found</li>
        ) : (
          getFilteredEntries().map((entry) => {
            const index = entries.indexOf(entry);
            const isSelected = selectedEntries.includes(entry.id);
            return editingIndex === index ? (
                <li key={index} className="entry-item edit-mode">
                  <h4>Edit Entry</h4>
                  <div className={`input-wrapper ${editErrors.entryNumber ? "error" : ""}`}>
                    <input 
                      type="text" 
                      placeholder="Entry No." 
                      value={editData.entryNumber} 
                      disabled={!editEntryNumberEditable}
                      readOnly={!editEntryNumberEditable}
                      onChange={(e) => {
                        handleEditDataChange("entryNumber", e.target.value);
                        setEditErrors({...editErrors, entryNumber: null});
                      }}
                    ></input>
                    <button 
                      type="button"
                      className="entry-number-edit-btn"
                      onClick={() => {
                        setEditEntryNumberEditable(!editEntryNumberEditable);
                        if (!editEntryNumberEditable) {
                          setTimeout(() => {
                            const input = document.querySelector(".entry-item.edit-mode input[placeholder='Entry No.']");
                            if (input) input.focus();
                          }, 0);
                        }
                      }}
                      title="Edit Entry Number"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </button>
                    {editErrors.entryNumber && <div className="error-message">{editErrors.entryNumber}</div>}
                  </div>
                  <div className={`input-wrapper model-name-wrapper edit-mode ${editErrors.modelName ? "error" : ""}`}>
                    <input type="text" placeholder="Model Name" value={editData.modelName} onChange={(e) => {
                      handleEditDataChange("modelName", e.target.value);
                      setEditErrors({...editErrors, modelName: null});
                    }}></input>
                    {editErrors.modelName && <div className="error-message">{editErrors.modelName}</div>}
                  </div>
                  <div className={`input-wrapper ${editErrors.serialNumber ? "error" : ""}`}>
                    <input type="text" placeholder="Serial No." value={editData.serialNumber} onChange={(e) => {
                      handleEditDataChange("serialNumber", e.target.value);
                      setEditErrors({...editErrors, serialNumber: null});
                    }}></input>
                    {editErrors.serialNumber && <div className="error-message">{editErrors.serialNumber}</div>}
                  </div>
                  <div className={`input-wrapper ${editErrors.propertyNumber ? "error" : ""}`}>
                    <input type="text" placeholder="Property No." value={editData.propertyNumber} onChange={(e) => {
                      handleEditDataChange("propertyNumber", e.target.value);
                      setEditErrors({...editErrors, propertyNumber: null});
                    }}></input>
                    {editErrors.propertyNumber && <div className="error-message">{editErrors.propertyNumber}</div>}
                  </div>
                  <div className={`input-wrapper ${editErrors.status ? "error" : ""}`}>
                    <div className="status-filter">
                      <button
                        className="status-button"
                        onClick={() => {
                          setShowEditStatusMenu(!showEditStatusMenu);
                          setEditErrors({...editErrors, status: null});
                        }}
                        onBlur={() => setTimeout(() => setShowEditStatusMenu(false), 200)}
                      >
                        <span className="status-label">
                          {editData.conditionStatus === "" ? "Select Service Status" :
                           editData.conditionStatus === "Serviceable (SVC)" ? "Serviceable (SVC)" :
                           editData.conditionStatus === "Unserviceable (UNSVC)" ? "Unserviceable (UNSVC)" :
                           "Update (Masterlist)"}
                        </span>
                        <svg className="status-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {showEditStatusMenu && (
                        <div className="status-menu">
                          <div className="status-option" onClick={() => { 
                            handleEditDataChange("conditionStatus", "Serviceable (SVC)"); 
                            setShowEditStatusMenu(false);
                            setEditErrors({...editErrors, status: null});
                          }}>Serviceable (SVC)</div>
                          <div className="status-option" onClick={() => { 
                            handleEditDataChange("conditionStatus", "Unserviceable (UNSVC)"); 
                            setShowEditStatusMenu(false);
                            setEditErrors({...editErrors, status: null});
                          }}>Unserviceable (UNSVC)</div>
                          <div className="status-option" onClick={() => { 
                            handleEditDataChange("conditionStatus", "Update (Masterlist)"); 
                            setShowEditStatusMenu(false);
                            setEditErrors({...editErrors, status: null});
                          }}>Update (Masterlist)</div>
                        </div>
                      )}
                    </div>
                    {editErrors.status && <div className="error-message">{editErrors.status}</div>}
                  </div>
                  <div className={`input-wrapper ${editErrors.remarks ? "error" : ""}`}>
                    <input type="text" placeholder="Remarks" value={editData.remarks} onChange={(e) => {
                      handleEditDataChange("remarks", e.target.value);
                      setEditErrors({...editErrors, remarks: null});
                    }}></input>
                    {editErrors.remarks && <div className="error-message">{editErrors.remarks}</div>}
                  </div>
                  <div className="button-group">
                    <button onClick={handleSaveEdit} className="save-btn">Save</button>
                    <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                  </div>
                </li>
              ) : (
              <li 
                key={index} 
                className={`entry-item ${entry.conditionStatus === "Serviceable (SVC)" ? "status-serviceable" : entry.conditionStatus === "Unserviceable (UNSVC)" ? "status-unserviceable" : "status-update"} ${isSelected ? "selected" : ""}`}
                data-entry-number={entry.entryNumber}
              >
                  {bulkDeleteMode && (
                    <input 
                      type="checkbox" 
                      className="entry-checkbox"
                      checked={isSelected}
                      onChange={() => toggleEntrySelection(index)}
                    />
                  )}
                  <div className="entry-content">
                    <strong>Entry No.:</strong> {entry.entryNumber}<br />
                    <strong>Model Name:</strong> {entry.modelName}<br />
                    <strong>Serial No.:</strong> {entry.serialNumber}<br />
                    <strong>Property No.:</strong> {entry.propertyNumber}<br />
                    <strong>Service Status:</strong> <span className={`status-badge ${entry.conditionStatus === "Serviceable (SVC)" ? "serviceable" : entry.conditionStatus === "Unserviceable (UNSVC)" ? "unserviceable" : "update"}`}>{entry.conditionStatus}</span><br />
                    <strong>Remarks:</strong> {entry.remarks}<br />
                    <div className="entry-timestamps">
                      <small>Created: {entry.createdAt || "N/A"}</small><br />
                      <small>Updated: {entry.updatedAt || "N/A"}</small>
                    </div>
                  </div>
                  <div className="button-group">
                    <button onClick={() => handleEditEntry(index)} className="edit-btn">Edit</button>
                    <button onClick={() => handleRemoveEntry(index)} className="remove-btn">Remove</button>
                  </div>
                </li>
              );
            })
          )}
      </ul>
      
      {deleteConfirm.show && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Are you sure you want to delete?</h3>
            <div className="confirmation-buttons">
              <button onClick={confirmDelete} className="confirm-yes-btn">Yes</button>
              <button onClick={cancelDelete} className="confirm-no-btn">No</button>
            </div>
          </div>
        </div>
      )}
      
      {warnings.show && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>{warnings.type === "exact_duplicate" ? "Duplicate Entry Detected" : warnings.type === "duplicate_serial_property" ? "Duplicate Serial & Property Number" : "Entry Number Gap Detected"}</h3>
            <p className="warning-message">{warnings.message}</p>
            <div className="confirmation-buttons">
              <button onClick={warnings.onConfirm} className="confirm-yes-btn">{warnings.action?.confirm || "Continue"}</button>
              {warnings.action?.cancel && <button onClick={warnings.onCancel} className="confirm-no-btn">{warnings.action?.cancel || "Cancel"}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
   
}


export default Array;
