import { create } from "zustand";

const useStore = create((set) => ({
  complaints: [],
  appliedFilters: [],
  totalPages: 1,
  currentPage: 0,
  rowsPerPage: 10,
  totalComplaints: 1,
  totalStatusCounts: {},
  selectedRows: [],
  loading: true,
  refresh: false,

  // Setters for each state variable
  setComplaints: (aComplaints) => set({ complaints: aComplaints }),
  setTotalStatusCounts: (totalStatusCounts) => set({ totalStatusCounts: totalStatusCounts }),
  updateComplaint: (complaintId, field, value) => {
    set((state) => {
      const complaintIndex = state.complaints.findIndex((complaint) => complaint.complaintId === complaintId);

      if (complaintIndex === -1) return state;

      const updatedComplaints = [...state.complaints];
      updatedComplaints[complaintIndex] = {
        ...updatedComplaints[complaintIndex],
        [field]: value,
      };

      return { complaints: updatedComplaints, refresh: true };
    });
  },
  setSelectedRows: (rows) => {
    set({ selectedRows: rows });
  },
  setAppliedFilters: (aFilters) => set({ appliedFilters: aFilters }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setRowsPerPage: (rows) => set({ rowsPerPage: rows }),
  setLoading: (load) => set({ loading: load }),
  setPagination: (page, totalComplaint, totalPages) =>
    set({
      currentPage: page,
      totalComplaints: totalComplaint,
      totalPages: totalPages,
    }),
  setComplaints: (aComplaints) => set({ complaints: aComplaints }),
  setRefresh: (newRef) => set({ refresh: newRef }),
}));

export default useStore;
