import { HeroParallax } from "./ui/hero-parallax"

function Home() {

    const products = [
        {
            title: "Connect with friends",
            link: "/login/login",
            thumbnail:
            "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress",
        },
        {
            title: "Share your moments",
            link: "/login",
            thumbnail:
            "https://images.pexels.com/photos/3040631/pexels-photo-3040631.jpeg",
        },
        {
            title: "Discover your interests",
            link: "/login",
            thumbnail:
            "https://images.pexels.com/photos/207896/pexels-photo-207896.jpeg?auto=compress",
        },

        {
            title: "Stay updated",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress"
        },
        {
            title: "Join the community",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/5081418/pexels-photo-5081418.jpeg?auto=compress"
        },
        {
            title: "Express yourself",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/15635241/pexels-photo-15635241/free-photo-of-strategy-plan-on-a-desk-in-an-office.jpeg?auto=compress"
        },

        {
            title: "Customizable profile",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/5361247/pexels-photo-5361247.jpeg?auto=compress"
        },
        {
            title: "Follow your passion",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/4698011/pexels-photo-4698011.jpeg?auto=compress"
        },
        {
            title: "Safe and secure",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/919734/pexels-photo-919734.jpeg?auto=compress"
        },
        {
            title: "Meet new peoplw",
            link: "/login",
            thumbnail:
                "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress"
        },
        {
            title: "Personalized feed",
            link: "/login",
            thumbnail:
                ""
        },

        {
            title: "Interactive stories",
            link: "/login",
            thumbnail:
                ""
        },
        {
            title: "Trending topics",
            link: "/login",
            thumbnail:
                ""
        },
        {
            title: "Create groups",
            link: "/login",
            thumbnail:
                ""
        },
        {
            title: "Free to use",
            link: "/login",
            thumbnail:
                ""
        },
    ];
    return (
        <div className="">
        <HeroParallax products={products} title="Sociial" description="A platform where users can connect with others and build their network. If you've used any other platforms, this is gonna be a completely different experience." />
        </div>
    )
}

export default Home