import express, { response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import axios from "axios";
import lodash from "lodash";

dotenv.config();


const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())



const memorizeFetch = lodash.memoize(async () => {
    try {

        const axiosInstance = axios.create({
            headers: {
                "x-hasura-admin-secret": process.env.SECRET
            }
        });

        const result = await axiosInstance.get("https://intent-kit-16.hasura.app/api/rest/blogs");
        return result.data.blogs;
    } catch (error) {
        console.log("Error in fetching data from the third-party API", error);
        throw error; // Rethrow the error if needed
    }
});



const memorizeLongestTitleBlog = lodash.memoize((blogs) => {
    let max_length = 0;
    let longest_blog = -1;
    lodash.forEach(blogs, function (blog, i) {
        if (blog.title?.length > max_length) {
            max_length = blog.title?.length;
            longest_blog = i;
        }
    })
    return longest_blog;
});



const memoizeNumberOfBlogsWithQuery = lodash.memoize((blogs, query) => {
    let total_blogs = 0;
    lodash.forEach(blogs, function (blog, i) {
        if (blog.title.includes(query)) {
            total_blogs++;
        }
    })
    return total_blogs;
});



const memoizeUniqueBlogsTitles = lodash.memoize((blogs) => {
    let unique_blogs_titles = [];
    lodash.forEach(blogs, function (blog, i) {
        if (!unique_blogs_titles.includes(blog.title)) {
            unique_blogs_titles.push(blog.title);
        }
    })
    return unique_blogs_titles;
});

const memoizeBlogsWithQuery = (blogs, query) => {
    let filtered_blogs = lodash.filter(blogs, function (blog, i) {
        return blog.title.includes(query);
    })
    return filtered_blogs;
}

app.get("/api/blog-stats", async (req, res) => {

    //  - Calculate the total number of blogs fetched.
    const blogs = await memorizeFetch();
    const size = lodash.size(blogs);


    //  - Find the blog with the longest title.
    const longest_blog = memorizeLongestTitleBlog(blogs);


    //  - Determine the number of blogs with titles containing the word "privacy."
    const total_blogs = memoizeNumberOfBlogsWithQuery(blogs, "privacy");

    //  - Create an array of unique blog titles (no duplicates).
    let unique_blogs_titles = memoizeUniqueBlogsTitles(blogs);

    const response = {
        "Total No Of blogs": size,
        "Blog with longest title": blogs[longest_blog],
        "Number of blogs containing word privacy in title": total_blogs,
        "Array of unique blog titles": unique_blogs_titles
    }

    res.send(response);

})


app.get("/api/blog-search/:query", async (req, res) => {

    let query = req.params.query;
    let blogs = await memorizeFetch();
    let filtered_blogs = memoizeBlogsWithQuery(blogs, query);
    res.send(filtered_blogs);
})



app.listen(5000, () => {
    console.log("Server started");
})
