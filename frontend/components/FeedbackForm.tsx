import { useForm, ValidationError } from "@formspree/react";

function FeedbackForm() {
  const [state, handleSubmit] = useForm("xlgwyvoq");

  if (state.succeeded) {
    return (
      <div className="w-full max-w-xl text-center py-8 bg-[#121215] border border-zinc-800/80 rounded-md">
        <div className="text-emerald-400 text-sm font-semibold">
          Feedback Submitted
        </div>
        <p className="text-zinc-400 text-xs mt-1">
          Thank you for helping us improve Algo Mentor.
        </p>
      </div>
    );
  }

  return (
    <form
      action="https://formspree.io/f/xlgwyvoq"
      method="POST"
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-[#121215] border border-zinc-800/80 p-6 rounded-md space-y-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-medium text-zinc-400">
          Your Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="name@example.com"
          className="w-full px-3 py-2 text-xs rounded-md bg-[#18181b] border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500"
        />
        <ValidationError
          prefix="Email"
          field="email"
          errors={state.errors}
          className="text-red-400 text-xs mt-1"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-xs font-medium text-zinc-400">
          Feedback Details
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          required
          placeholder="Share your experience or report an issue..."
          className="w-full px-3 py-2 text-xs rounded-md bg-[#18181b] border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
          className="text-red-400 text-xs mt-1"
        />
      </div>

      <input type="hidden" name="_subject" value="New Feedback - Algo Mentor" />

      <button
        type="submit"
        disabled={state.submitting}
        className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-md transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        {state.submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}

export default FeedbackForm;