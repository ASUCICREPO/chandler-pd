import { create } from "zustand";

const useStore = create((set) => ({
  complaints: [],
  appliedFilters: [],
  totalPages: 1,
  currentPage: 1,
  rowsPerPage: 10,
  totalComplaints: 1,
  loading: true,

  // Setters for each state variable
  setComplaints: (aComplaints) => set({ complaints: aComplaints }),
  setAppliedFilters: (aFilters) => set({ appliedFilters: aFilters }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setRowsPerPage: (rows) => set({ rowsPerPage: rows }),
  setLoading: (load) => set({ loading: load }),
  setTotalComplaints: (count) => set({ totalComplaints: count }),
}));

export default useStore;
