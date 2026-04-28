 import { useParams, Navigate } from "react-router-dom";
 
 /**
  * Redirect from /profile/:userId to /profile?id=userId
  * This maintains backward compatibility with links using path params
  */
 export default function UserProfile() {
   const { userId } = useParams<{ userId: string }>();
   
   if (!userId) {
     return <Navigate to="/profile" replace />;
   }
   
   return <Navigate to={`/profile?id=${userId}`} replace />;
 }