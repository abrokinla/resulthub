import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">ResultHub</h1>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
            >
              Register School
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-4">
            School Result Management
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Manage student results, generate report cards, and give parents access
            to their children&apos;s performance — all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark"
            >
              Get Started
            </Link>
            <Link
              href="/access"
              className="border dark:border-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Parent Access
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2">For Schools</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and manage student results. Teachers enter scores, admin
              approves before publishing.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2">For Teachers</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Record tests and exams, track performance, and add comments for each
              student.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2">For Parents</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Access your child&apos;s results remotely using the unique PIN
              provided by the school.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t dark:border-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} ResultHub. All rights reserved.
      </footer>
    </div>
  );
}
