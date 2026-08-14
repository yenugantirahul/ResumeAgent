import { Router } from "express";

const router = Router();


router.get("/", (req, res) => {
    console.log("Resume Analyzed")
})


export default router