"use babel"

import { actions, markdownRenderer } from "inkdrop"

import visit from "unist-util-visit"

const pkg = "color-highlighter"

const toggleCmd                    = `${pkg}:toggle`
const monospacedFontToggleCmd      = `${pkg}:monospaced-font-toggle`
const coloredTextModeCmd           = `${pkg}:colored-text-mode`
const coloredTextBackgroundModeCmd = `${pkg}:colored-text-background-mode`
const coloredBackgroundModeCmd     = `${pkg}:colored-background-mode`
const textNoCaseChangeCmd          = `${pkg}:text-no-case-change`
const textToUppercaseCmd           = `${pkg}:text-to-uppercase`
const textToLowercaseCmd           = `${pkg}:text-to-lowercase`

const enabledCfg         = `${pkg}.enabled`
const displayModeCfg     = `${pkg}.displayMode`
const backgroundColorCfg = `${pkg}.backgroundColor`
const monospacedFontCfg  = `${pkg}.monospacedFont`
const textCaseCfg        = `${pkg}.textCase`

const coloredTextMode           = "Colored Text"
const coloredTextBackgroundMode = "Colored Text + Background"
const coloredBackgroundMode     = "Colored Background"

const caseNoChange = "No Change"
const caseToUpper  = "To Uppercase"
const caseToLower  = "To Lowercase"

const colorCodeRegexp = /#[0-9a-fA-F]{6}/g

const highlighter = options => tree => {

    if (!inkdrop.config.get(enabledCfg)) {
        return
    }

    const displayMode     = inkdrop.config.get(displayModeCfg)
    const backgroundColor = inkdrop.config.get(backgroundColorCfg)
    const monospacedFont  = inkdrop.config.get(monospacedFontCfg)
    const textCase        = inkdrop.config.get(textCaseCfg)

    const fontFamily = monospacedFont ? "font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace; font-size: 90%;" : ""

    let textTransform;
    switch(textCase) {
        case caseNoChange:
            textTransform = ""
            break
        case caseToUpper:
            textTransform = "text-transform: uppercase;"
            break
        case caseToLower:
            textTransform = "text-transform: lowercase;"
            break
        default:
            console.error(`ERROR: Unkown text case "${textCase}"`)
            textTransform = ""
    }

    visit(tree, "text", node => {
        if (node.value.search(colorCodeRegexp) < 0) {
            return
        }

        node.type = "html"
        node.value = node.value.replace(
            colorCodeRegexp,
            match => {
                switch(displayMode) {
                    case coloredTextMode:
                        return `<span style="color: ${match}; ${fontFamily} ${textTransform}">${match}</span>`
                    case coloredTextBackgroundMode:
                        return `<span style="color: ${match}; background-color: ${backgroundColor}; ${fontFamily} ${textTransform} border-radius: 2px; padding-left: 3px; padding-right: 3px;">${match}</span>`
                    case coloredBackgroundMode:
                        return `<span style="background-color: ${match}; ${fontFamily} ${textTransform} border-radius: 2px; padding-left: 3px; padding-right: 3px;">${match}</span>`
                    default:
                        console.error(`ERROR: Unkown disaply mode: "${displayMode}"`)
                        return "???"
                }
            },
        )
    })

}

const triggerEditorUpdate = () => {
    inkdrop.store.dispatch(actions.editingNote.update({}))
}

module.exports = {

    config: {
        enabled: {
            title: "Enabled",
            description: "Quick toggle of color highlighter",
            type: "boolean",
            default: true
        },

        monospacedFont: {
            title: "Monospaced Font",
            description: "Use regular editor font or monospaced font",
            type: "boolean",
            default: true
        },

        displayMode: {
            title: "Display Mode",
            description: "How to display highlighted colors",
            type: "string",
            enum: [coloredTextMode, coloredTextBackgroundMode, coloredBackgroundMode],
            default: coloredTextMode
        },

        textCase: {
            title: "Text Case",
            description: "How to change color codes text",
            type: "string",
            enum: [caseNoChange, caseToUpper, caseToLower],
            default: caseToUpper
        },

        backgroundColor: {
            title: "Background Color",
            description: `Used for "${coloredTextBackgroundMode}" display mode, use values of CSS colors like "#11FF60" or variable like "var(--light-secondary-color)"`,
            type: "string",
            default: "var(--light-secondary-color)" 
        }
    },

    activate() {

        if (!markdownRenderer) {
            return
        }

        inkdrop.commands.add(document.body, toggleCmd, e => {
            const enabled = inkdrop.config.get(enabledCfg)
            inkdrop.config.set(enabledCfg, !enabled)
        })

        inkdrop.commands.add(document.body, monospacedFontToggleCmd, e => {
            const enabled = inkdrop.config.get(monospacedFontCfg)
            inkdrop.config.set(monospacedFontCfg, !enabled)
        })

        inkdrop.commands.add(document.body, coloredTextModeCmd,           e => { inkdrop.config.set(displayModeCfg, coloredTextMode) })
        inkdrop.commands.add(document.body, coloredTextBackgroundModeCmd, e => { inkdrop.config.set(displayModeCfg, coloredTextBackgroundMode) })
        inkdrop.commands.add(document.body, coloredBackgroundModeCmd,     e => { inkdrop.config.set(displayModeCfg, coloredBackgroundMode) })

        inkdrop.commands.add(document.body, textNoCaseChangeCmd, e => { inkdrop.config.set(textCaseCfg, caseNoChange) })
        inkdrop.commands.add(document.body, textToUppercaseCmd,  e => { inkdrop.config.set(textCaseCfg, caseToUpper) })
        inkdrop.commands.add(document.body, textToLowercaseCmd,  e => { inkdrop.config.set(textCaseCfg, caseToLower) })

        inkdrop.config.observe(enabledCfg,         isEnabled            => { triggerEditorUpdate() })
        inkdrop.config.observe(backgroundColorCfg, bgColor              => { triggerEditorUpdate() })
        inkdrop.config.observe(monospacedFontCfg,  isMonospaced         => { triggerEditorUpdate() })
        inkdrop.config.observe(textCaseCfg,        textCase             => { triggerEditorUpdate() })
        inkdrop.config.onDidChange(displayModeCfg, ({newMode, oldMode}) => { triggerEditorUpdate() }) 

        markdownRenderer.remarkPlugins.push(highlighter)

    },

    deactivate() {

        if (!markdownRenderer) {
            return
        }

        const { remarkPlugins } = markdownRenderer

        const i = remarkPlugins.indexOf(highlighter)
        if (i >= 0) {
            remarkPlugins.splice(i, 1)
        }

        inkdrop.store.dispatch(actions.editingNote.update({}))

    }

}

