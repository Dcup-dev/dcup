import { SiNotion, SiAwslambda, SiGmail, SiSlack, SiConfluence, SiGoogledrive } from "react-icons/si";
import { FaCloud } from "react-icons/fa";

export const getServiceIcon = (service: string) => {
  switch (service) {
    case 'GOOGLE_DRIVE':
      return <SiGoogledrive className="w-5 h-5" />;
    case 'AWS':
      return <SiAwslambda className="w-5 h-5" />;
    case 'NOTION':
      return <SiNotion className="w-5 h-5" />;
    case 'SLACK':
      return <SiSlack className="w-5 h-5" />;
    case 'GMAIL':
      return <SiGmail className="w-5 h-5" />;
    case 'CONFLUENCE':
      return < SiConfluence className="w-5 h-5" />;
    default:
      return <FaCloud className="w-5 h-5" />;
  }
};
