import { createSlice } from "@reduxjs/toolkit";

const usersSlice = createSlice({
    name: 'user',
    initialState: { 
        user: null,
        allUsers: [],
        allChats: [],
        selectedChats: null
    },

    reducers: {
        setUser: (state, action) => { state.user = action.payload; },
        setAllUsers: (state, action) => { state.allUsers = action.payload; },
        setAllChats: (state, action) => { state.allChats = action.payload; },
        setSelectedChats: (state, action) => { state.selectedChats = action.payload; }
    }
});

export const { setUser,setAllUsers,setAllChats,setSelectedChats} = usersSlice.actions;
export default usersSlice.reducer;