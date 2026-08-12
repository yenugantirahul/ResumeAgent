import { SignIn } from '@clerk/nextjs'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResumeAgent | SignIn",
};
const page = () => {
  return (
    <div className='m-auto'>
        <SignIn signUpUrl='/sign-up' />
    </div>
  )
}

export default page