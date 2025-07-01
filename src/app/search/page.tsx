import React, { useState, useCallback } from "react";
import { Search, Filter, Sparkles, Tag, TrendingUp, Clock } from "lucide-react";

interface SearchResult {
    postId: string;
    score: number;
    title: string;
    summary: string;
    subredditName: string;
    authorName: string;
    tags: string[];
    category: string;
    sentiment: "positive" | "negative" | "neutral";
    createdAt: string;
}

interface SearchResponse {
    query: string;
    results: SearchResult[];
    total: number;
}

const EnhancedSearchComponent = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isVectorSearch, setIsVectorSearch] = useState(true);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSentiment, setSelectedSentiment] = useState("");
    const [selectedSubreddit, setSelectedSubreddit] = useState("");
    const [scoreThreshold, setScoreThreshold] = useState(0.7);

    const categories = [
        "technology",
        "entertainment",
        "news",
        "discussion",
        "question",
        "meme",
        "educational",
        "sports",
        "gaming",
    ];

    const sentiments = ["positive", "negative", "neutral"];

    const searchPosts = useCallback(async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const searchEndpoint = isVectorSearch
                ? "/api/search/vector"
                : "/api/posts";

            if (isVectorSearch) {
                const response = await fetch(searchEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: query.trim(),
                        limit: 20,
                        threshold: scoreThreshold,
                        subredditName: selectedSubreddit || undefined,
                        category: selectedCategory || undefined,
                        sentiment: selectedSentiment || undefined,
                    }),
                });

                if (response.ok) {
                    const data: SearchResponse = await response.json();
                    setResults(data.results);
                }
            } else {
                // Traditional search
                const params = new URLSearchParams({
                    searchQuery: query.trim(),
                    limit: "20",
                    page: "1",
                    ...(selectedSubreddit && {
                        subredditName: selectedSubreddit,
                    }),
                });

                const response = await fetch(`${searchEndpoint}?${params}`);
                if (response.ok) {
                    const posts = await response.json();
                    // Transform regular posts to match SearchResult interface
                    const transformedResults: SearchResult[] = posts.map(
                        (post: any) => ({
                            postId: post.id,
                            score: 1,
                            title: post.title,
                            summary: post.content?.substring(0, 150) || "",
                            subredditName: post.subreddit.name,
                            authorName:
                                post.author.username || post.author.name,
                            tags: [],
                            category: "general",
                            sentiment: "neutral",
                            createdAt: post.createdAt,
                        })
                    );
                    setResults(transformedResults);
                }
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, [
        query,
        isVectorSearch,
        scoreThreshold,
        selectedSubreddit,
        selectedCategory,
        selectedSentiment,
    ]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchPosts();
    };

    const clearFilters = () => {
        setSelectedCategory("");
        setSelectedSentiment("");
        setSelectedSubreddit("");
        setScoreThreshold(0.7);
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case "positive":
                return "text-green-600 bg-green-100";
            case "negative":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const formatScore = (score: number) => {
        return (score * 100).toFixed(1);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            {/* Search Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Search className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-800">
                        Enhanced Search
                    </h2>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => setIsVectorSearch(!isVectorSearch)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                isVectorSearch
                                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                                    : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                        >
                            {isVectorSearch ? (
                                <div className="flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" />
                                    AI Search
                                </div>
                            ) : (
                                "Regular Search"
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-4">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={
                                    isVectorSearch
                                        ? "Search with AI - describe what you're looking for..."
                                        : "Search posts..."
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                            />
                            <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 border rounded-lg transition-colors ${
                                showFilters
                                    ? "bg-blue-50 border-blue-300 text-blue-700"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </div>
                </form>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-800">
                                Search Filters
                            </h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() +
                                                cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sentiment Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sentiment
                                </label>
                                <select
                                    value={selectedSentiment}
                                    onChange={(e) =>
                                        setSelectedSentiment(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Sentiments</option>
                                    {sentiments.map((sentiment) => (
                                        <option
                                            key={sentiment}
                                            value={sentiment}
                                        >
                                            {sentiment.charAt(0).toUpperCase() +
                                                sentiment.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subreddit Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subreddit
                                </label>
                                <input
                                    type="text"
                                    value={selectedSubreddit}
                                    onChange={(e) =>
                                        setSelectedSubreddit(e.target.value)
                                    }
                                    placeholder="r/subreddit"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Score Threshold (Vector Search Only) */}
                            {isVectorSearch && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Relevance (
                                        {(scoreThreshold * 100).toFixed(0)}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.1"
                                        value={scoreThreshold}
                                        onChange={(e) =>
                                            setScoreThreshold(
                                                parseFloat(e.target.value)
                                            )
                                        }
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Search Results */}
            <div className="space-y-4">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Searching...</span>
                    </div>
                )}

                {!loading && results.length === 0 && query && (
                    <div className="text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No results found for "{query}"</p>
                        <p className="text-sm">
                            Try adjusting your search terms or filters
                        </p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">
                                Found {results.length} results for "{query}"
                            </p>
                            {isVectorSearch && (
                                <div className="flex items-center gap-1 text-xs text-purple-600">
                                    <Sparkles className="w-3 h-3" />
                                    AI-powered search
                                </div>
                            )}
                        </div>

                        {results.map((result) => (
                            <div
                                key={result.postId}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                {/* Post Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-1 hover:text-blue-600 cursor-pointer">
                                            {result.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                            <span>
                                                r/{result.subredditName}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                by u/{result.authorName}
                                            </span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(
                                                    result.createdAt
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {isVectorSearch && (
                                        <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                            <TrendingUp className="w-3 h-3" />
                                            {formatScore(result.score)}% match
                                        </div>
                                    )}
                                </div>

                                {/* Post Summary */}
                                {result.summary && (
                                    <p className="text-gray-700 mb-3 line-clamp-2">
                                        {result.summary}
                                    </p>
                                )}

                                {/* Metadata Tags */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {result.category && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            <Tag className="w-3 h-3" />
                                            {result.category}
                                        </span>
                                    )}

                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(
                                            result.sentiment
                                        )}`}
                                    >
                                        {result.sentiment}
                                    </span>

                                    {result.tags &&
                                        result.tags
                                            .slice(0, 3)
                                            .map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}

                                    {result.tags && result.tags.length > 3 && (
                                        <span className="text-xs text-gray-500">
                                            +{result.tags.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Search Tips */}
            {!query && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                        Search Tips
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            • Use AI Search for semantic understanding: "posts
                            about machine learning for beginners"
                        </li>
                        <li>
                            • Try specific queries: "funny cat videos" or
                            "serious discussion about climate change"
                        </li>
                        <li>
                            • Use filters to narrow down results by category,
                            sentiment, or subreddit
                        </li>
                        <li>
                            • Adjust relevance threshold to get more or fewer
                            results
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EnhancedSearchComponent;
