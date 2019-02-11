const Themes = [
    require('./Blackout.json'),
    require('./Whites.json'),
    require('./Blues.json'),
    require('./Warm'),
    require('./Go.json'),
    require('./Muted.json'),
]

let DefaultTheme = Themes.find(item => {
    return item.id === 'default';
})
export { DefaultTheme };


export default Themes;