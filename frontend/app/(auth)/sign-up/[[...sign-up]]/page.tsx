import { SignUp } from '@clerk/nextjs'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResumeAgent | Sigin",
};

const page = () => {
  return (
    <div className='m-auto p-[50px]'>
        <SignUp signInUrl='/sign-in' />
    </div>
  )
}

export default page