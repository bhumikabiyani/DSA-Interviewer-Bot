import { useForm, ValidationError } from "@formspree/react";


function FeedbackForm() {
  const [state, handleSubmit] = useForm("xlgwyvoq");

  if (state.succeeded) {
    return (
      <div className="w-1/2 text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
        <div className="text-emerald-400 text-lg font-semibold">
          Thank you for your feedback 💙
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Your input helps us improve Algo Mentor.
        </p>
      </div>
    );
  }

  return (
    <form
      action="https://formspree.io/f/xlgwyvoq"
      method="POST"
      onSubmit={handleSubmit}
      className="w-1/2 bg-white/5 border border-white/10 p-8 rounded-2xl space-y-6"
    >
      {/* Email */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
        />
        <ValidationError
          prefix="Email"
          field="email"
          errors={state.errors}
          className="text-red-400 text-xs mt-1"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Your Feedback
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
        />
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
          className="text-red-400 text-xs mt-1"
        />
      </div>

      {/* Optional: Subject line in email */}
      <input type="hidden" name="_subject" value="New Feedback - Algo Mentor" />

      <button
        type="submit"
        disabled={state.submitting}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
      >
        {state.submitting ? "Sending..." : "Send Feedback"}
      </button>
    </form>
  );
}

export default FeedbackForm;