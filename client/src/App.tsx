import Main from './components/Main';
import { Link, Routes, Route } from 'react-router-dom';
import Other from './components/Other';

const App: React.FC = () => {
    return (
        <div>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Main</Link>
                    </li>
                    <li>
                        <Link to="/other">Other route</Link>
                    </li>
                </ul>
            </nav>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/other" element={<Other />} />
            </Routes>
        </div>
    );
};

export default App;
