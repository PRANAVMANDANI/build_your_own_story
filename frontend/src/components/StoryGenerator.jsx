import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ThemeInput from "./ThemeInput.jsx";
import LoadingStatus from "./LoadingStatus.jsx";
import { API_BASE_URL } from "../util.js";


function StoryGenerator() {
    const navigate = useNavigate()
    const [theme, setTheme] = useState("")
    const [jobId, setJobId] = useState(null)
    const [jobStatus, setJobStatus] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const timeoutRef = useRef(null)
    const pollRef = useRef(null)

    // Poll whenever we have a jobId that is pending or processing
    useEffect(() => {
        if (jobId && (jobStatus === "processing" || jobStatus === "pending")) {
            pollRef.current = setInterval(() => {
                pollJobStatus(jobId)
            }, 3000) // poll every 3s for faster feedback
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [jobId, jobStatus])

    const generateStory = async (inputTheme) => {
        setLoading(true)
        setError(null)
        setTheme(inputTheme)

        // Safety timeout — show a clear error if nothing happens in 90 seconds
        timeoutRef.current = setTimeout(() => {
            setError("Story generation timed out. The AI might be overloaded — please try again.")
            setLoading(false)
            if (pollRef.current) clearInterval(pollRef.current)
        }, 90000)

        try {
            const response = await axios.post(`${API_BASE_URL}/stories/create`, { theme: inputTheme })
            const { job_id, status } = response.data
            setJobId(job_id)
            setJobStatus(status)
            // Do an immediate first poll without waiting for the interval
            pollJobStatus(job_id)
        } catch (e) {
            clearTimeout(timeoutRef.current)
            setLoading(false)
            setError(`Failed to start story generation: ${e.message}`)
        }
    }

    const pollJobStatus = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/jobs/${id}`)
            const { status, story_id, error: jobError } = response.data
            setJobStatus(status)

            if (status === "completed" && story_id) {
                clearTimeout(timeoutRef.current)
                if (pollRef.current) clearInterval(pollRef.current)
                fetchStory(story_id)
            } else if (status === "failed") {
                clearTimeout(timeoutRef.current)
                if (pollRef.current) clearInterval(pollRef.current)
                setError(jobError || "Story generation failed — the AI returned an unexpected response. Please try again.")
                setLoading(false)
            }
        } catch (e) {
            if (e.response?.status !== 404) {
                clearTimeout(timeoutRef.current)
                setError(`Failed to check story status: ${e.message}`)
                setLoading(false)
            }
        }
    }

    const fetchStory = async (id) => {
        try {
            setLoading(false)
            setJobStatus("completed")
            navigate(`/story/${id}`)
        } catch (e) {
            setError(`Failed to load story: ${e.message}`)
            setLoading(false)
        }
    }

    const reset = () => {
        clearTimeout(timeoutRef.current)
        if (pollRef.current) clearInterval(pollRef.current)
        setJobId(null)
        setJobStatus(null)
        setError(null)
        setTheme("")
        setLoading(false)
    }

    return <div className="story-generator">
        {error && <div className="error-message">
            <h2>⚠️ Something went wrong</h2>
            <p>{error}</p>
            <button onClick={reset}>Try Again</button>
        </div>}

        {!jobId && !error && !loading && <ThemeInput onSubmit={generateStory} />}

        {loading && <LoadingStatus theme={theme} />}
    </div>
}

export default StoryGenerator