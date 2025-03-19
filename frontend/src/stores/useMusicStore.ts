import { axiosInstance } from "@/lib/axios";
import { Album, Song, Stats } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";

interface MusicStore {
	songs: Song[];
	albums: Album[];
	isLoading: boolean;
	error: string | null;
	currentAlbum: Album | null;
	featuredSongs: Song[];
	madeForYouSongs: Song[];
	trendingSongs: Song[];
	stats: Stats;
	searchResults: Song[];
	searchQuery: string;

	fetchAlbums: () => Promise<void>;
	fetchAlbumById: (id: string) => Promise<void>;
	fetchFeaturedSongs: () => Promise<void>;
	fetchMadeForYouSongs: () => Promise<void>;
	fetchTrendingSongs: () => Promise<void>;
	fetchStats: () => Promise<void>;
	fetchSongs: () => Promise<void>;
	deleteSong: (id: string) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	searchSongs: (query: string) => Promise<void>;
}

export const useMusicStore = create<MusicStore>((set) => ({
	albums: [],
	songs: [],
	isLoading: false,
	error: null,
	currentAlbum: null,
	madeForYouSongs: [],
	featuredSongs: [],
	trendingSongs: [],
	searchResults: [],
	searchQuery: "",
	stats: {
		totalSongs: 0,
		totalAlbums: 0,
		totalUsers: 0,
		totalArtists: 0,
	},

	deleteSong: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/songs/${id}`);

			set((state) => ({
				songs: state.songs.filter((song) => song._id !== id),
			}));
			toast.success("Song deleted successfully");
		} catch (error: any) {
			console.log("Error in deleteSong", error);
			toast.error("Error deleting song");
		} finally {
			set({ isLoading: false });
		}
	},

	deleteAlbum: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/albums/${id}`);
			set((state) => ({
				albums: state.albums.filter((album) => album._id !== id),
				songs: state.songs.map((song) =>
					song.albumId === state.albums.find((a) => a._id === id)?.title ? { ...song, album: null } : song
				),
			}));
			toast.success("Album deleted successfully");
		} catch (error: any) {
			toast.error("Failed to delete album: " + error.message);
		} finally {
			set({ isLoading: false });
		}
	},

	fetchSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs");
			set({ songs: response.data });
		} catch (error: any) {
			set({ error: error.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchStats: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/stats");
			set({ stats: response.data });
		} catch (error: any) {
			set({ error: error.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchAlbums: async () => {
		set({ isLoading: true, error: null });

		try {
			const response = await axiosInstance.get("/albums");
			set({ albums: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchAlbumById: async (id) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/albums/${id}`);
			set({ currentAlbum: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchFeaturedSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/featured");
			set({ featuredSongs: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchMadeForYouSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/made-for-you");
			set({ madeForYouSongs: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchTrendingSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/trending");
			set({ trendingSongs: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	searchSongs: async (query: string) => {
		console.log("Search Query:", query); // Log the search query
	set({ isLoading: true, error: null, searchQuery: query });
		try {
			const currentState = useMusicStore.getState();
			
			// If we don't have songs loaded yet, fetch from all public endpoints
			if (currentState.featuredSongs.length === 0) {
				await currentState.fetchFeaturedSongs();
			}
			if (currentState.madeForYouSongs.length === 0) {
				await currentState.fetchMadeForYouSongs();
			}
			if (currentState.trendingSongs.length === 0) {
				await currentState.fetchTrendingSongs();
			}
			
			// Combine all songs from public endpoints
			const allSongs = [
				...currentState.featuredSongs,
				...currentState.madeForYouSongs,
				...currentState.trendingSongs
			];
			
			// Remove duplicates using Map with song._id as key
			const uniqueSongs = Array.from(new Map(allSongs.map(song => [song._id, song])).values());
			
			// Filter songs that start with the query (case-insensitive)
			const queryLower = query.toLowerCase();
			const searchResults = uniqueSongs.filter(song => 
				song.title.toLowerCase().startsWith(queryLower) ||
				song.artist.toLowerCase().startsWith(queryLower)
			);

			console.log("Search Results:", searchResults); // Log the search results
	set({ searchResults });
		} catch (error: any) {
			console.error("Search error:", error);
			set({ error: error.message });
			// Even if there's an error, try to search through any songs we already have
			const currentState = useMusicStore.getState();
			const allSongs = [
				...currentState.featuredSongs,
				...currentState.madeForYouSongs,
				...currentState.trendingSongs
			];
			
			const uniqueSongs = Array.from(new Map(allSongs.map(song => [song._id, song])).values());
			const queryLower = query.toLowerCase();
			const searchResults = uniqueSongs.filter(song => 
				song.title.toLowerCase().startsWith(queryLower) ||
				song.artist.toLowerCase().startsWith(queryLower)
			);
			
			set({ searchResults });
		} finally {
			set({ isLoading: false });
		}
	},
}));
