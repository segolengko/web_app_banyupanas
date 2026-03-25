import LoginForm from './login-form'

export const metadata = {
  title: 'Login Admin - Banyupanas Ticketing',
  description: 'Masuk ke sistem manajemen tiket Banyupanas',
};

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="login-wrapper">
      <LoginForm message={searchParams?.message} />
    </div>
  )
}
