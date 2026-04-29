"use client"

import { useEffect, useState } from "react"

export default function useDebounce<T>(value: T, delay = 5000): T {
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => window.clearTimeout(timeoutId)
	}, [value, delay])

	return debouncedValue
}