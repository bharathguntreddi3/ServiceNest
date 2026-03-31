import Hero from "../sections/Hero";
import Categories from "../sections/Categories";
import PopularServices from "../sections/PopularServices";
import WhyUs from "../sections/WhyUs";
import Testimonials from "../sections/Testimonials";
import Footer from "../sections/Footer";
import Stats from "../sections/Stats";

export default function Landing() {
  return (
    <div>
      <Hero />
      <Stats />
      <Categories />
      <PopularServices />
      <WhyUs />
      <Testimonials />
      <Footer />
    </div>
  );
}
