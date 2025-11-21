// @/services/authService.ts
import instance from "@/util/axiosCustomize";

const postRegister = async (username: string, email: string, password: string) => {
    const response = await instance.post(`/api/auth/register`, {
        username, 
        email, 
        password
    });
    return response.data; // ✅ Return response.data
}

const postLogin = async(email : string, password: string) => {
    const response = await instance.post(`/api/auth/login`, {
        email,
        password
    })
    return response.data;
}

const postGoogleLogin = async( credential: string) =>{
    const response = await instance.post(`/api/auth/google`,{
        credential
    })
    return response.data;
}

const postTask = async(title: string, description: string, dueDate: Date ) => {
    const response = await instance.post(`/api/tasks/`,{
        title,
        description,
        dueDate
    })
    return response.data;
}

const getTasks = async() => {
    const response = await instance.get(`/api/tasks`);
    return response.data;
}


const updateTask = async(id: string) => {
    const response = await instance.put(`/api/tasks/${id}`);
}

const deleteTask = async (id: string) =>{
    const response = await instance.delete(`/api/tasks/${id}`);
}

export { postRegister, postLogin, postGoogleLogin, postTask, getTasks, updateTask, deleteTask}