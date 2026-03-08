import Section from "./Section";
import { ThreeLogo } from "./ThreeLogo";
import HomeTypeFromCms from "./HomeTypeFromCms";

export default function HomeSection() {
  return (

      <div className="homeStage">
        

        <div className="homeTextLayer">
          <HomeTypeFromCms />
        </div>
      </div>

  );
}
